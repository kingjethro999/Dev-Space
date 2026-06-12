import { NextRequest, NextResponse } from 'next/server';
import { getGitHubAccessToken, parseGitHubUrl } from '@/lib/github-utils';

export async function POST(request: NextRequest) {
  try {
    const { githubUrl, userId } = await request.json();

    if (!githubUrl) {
      return NextResponse.json({ error: 'githubUrl is required' }, { status: 400 });
    }

    const parsed = parseGitHubUrl(githubUrl);
    if (!parsed) {
      return NextResponse.json({ error: 'Invalid GitHub URL' }, { status: 400 });
    }

    const { owner, repo } = parsed;

    // Get GitHub Access Token if user is logged in and connected
    let accessToken: string | null = null;
    if (userId) {
      accessToken = await getGitHubAccessToken(userId);
    }

    const headers: Record<string, string> = {
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'Dev-Space-App',
    };

    if (accessToken) {
      headers['Authorization'] = `token ${accessToken}`;
    }

    // 1. Fetch repo details to get default branch
    const repoInfoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
    if (!repoInfoRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch repo info from GitHub: ${repoInfoRes.statusText}` },
        { status: repoInfoRes.status }
      );
    }

    const repoInfo = await repoInfoRes.json();
    const defaultBranch = repoInfo.default_branch || 'main';

    // 2. Fetch git tree recursively
    const treeRes = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/git/trees/${defaultBranch}?recursive=1`,
      { headers }
    );

    if (!treeRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch repository tree: ${treeRes.statusText}` },
        { status: treeRes.status }
      );
    }

    const treeData = await treeRes.json();
    const items = treeData.tree || [];

    // 3. Filter files
    // Exclude noise
    const ignoredPatterns = [
      /node_modules\//,
      /\.next\//,
      /dist\//,
      /build\//,
      /\.git\//,
      /\.github\//,
      /package-lock\.json/,
      /yarn\.lock/,
      /pnpm-lock\.yaml/,
      /\.png$/,
      /\.jpg$/,
      /\.jpeg$/,
      /\.gif$/,
      /\.ico$/,
      /\.svg$/,
      /\.webp$/,
      /\.woff$/,
      /\.woff2$/,
      /\.ttf$/,
      /\.eot$/,
      /\.mp4$/,
      /\.mp3$/,
      /\.zip$/,
      /\.tar\.gz$/,
    ];

    const allowedExtensions = [
      '.js', '.jsx', '.ts', '.tsx',
      '.py', '.go', '.rs', '.java',
      '.cpp', '.c', '.h', '.cs',
      '.rb', '.php', '.swift', '.kt',
      '.sh', '.yaml', '.yml', '.json',
      '.md', '.txt', '.toml', '.lock',
      '.sql', '.css', '.html'
    ];

    const filteredFiles = items.filter((item: any) => {
      if (item.type !== 'blob') return false;
      const path = item.path;

      // Check ignored patterns
      if (ignoredPatterns.some(pattern => pattern.test(path))) {
        return false;
      }

      // Check extensions
      return allowedExtensions.some(ext => path.endsWith(ext));
    });

    // Sort files to prioritize important ones
    // High priority: package.json, requirements.txt, cargo.toml, go.mod, readme.md, main app files
    const getPriority = (path: string) => {
      const lower = path.toLowerCase();
      if (lower === 'readme.md') return 100;
      if (lower === 'package.json') return 95;
      if (lower === 'requirements.txt') return 95;
      if (lower === 'go.mod') return 95;
      if (lower === 'cargo.toml') return 95;
      if (lower.startsWith('src/app/') || lower.startsWith('app/')) return 80;
      if (lower.startsWith('src/components/') || lower.startsWith('components/')) return 70;
      if (lower.startsWith('src/lib/') || lower.startsWith('lib/')) return 60;
      return 10;
    };

    filteredFiles.sort((a: any, b: any) => getPriority(b.path) - getPriority(a.path));

    // Take top 15 files to index
    const filesToFetch = filteredFiles.slice(0, 15);

    // 4. Fetch content of each file
    const filesWithContent = await Promise.all(
      filesToFetch.map(async (file: any) => {
        try {
          const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${defaultBranch}/${file.path}`;
          const contentRes = await fetch(rawUrl, {
            headers: accessToken ? { 'Authorization': `token ${accessToken}` } : {}
          });

          if (!contentRes.ok) {
            return {
              path: file.path,
              content: `[Failed to load file content: ${contentRes.statusText}]`
            };
          }

          let text = await contentRes.text();
          // Truncate to first 4000 characters if too large
          if (text.length > 4000) {
            text = text.substring(0, 4000) + '\n... [Content truncated due to size limit]';
          }

          return {
            path: file.path,
            content: text
          };
        } catch (err) {
          return {
            path: file.path,
            content: `[Error loading content: ${err instanceof Error ? err.message : String(err)}]`
          };
        }
      })
    );

    return NextResponse.json({
      owner,
      repo,
      defaultBranch,
      files: filesWithContent
    });
  } catch (error) {
    console.error('Error in GitHub indexing route:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
