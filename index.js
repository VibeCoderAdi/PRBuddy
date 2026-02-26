const Anthropic = require("@anthropic-ai/sdk");
const { Octokit } = require("@octokit/rest");

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const DEFENSIVE_CODING_PROMPT = `
You are a strict code reviewer. Review the following code diff against these 12 defensive coding techniques and point out every violation you find:

1. Null checks — always null-guard inputs
2. Input validation — validate before processing
3. Fail fast — throw early, don't let bad state propagate
4. Immutability — prefer final/immutable objects
5. Least privilege — fields/methods should be as private as possible
6. Error handling — no swallowed exceptions or empty catch blocks
7. Boundary conditions — check array bounds, empty collections, overdrafts
8. Type safety — avoid raw types and unsafe casts
9. Resource management — always close streams/connections
10. Defensive copying — don't expose internal mutable state
11. Dead code — no unreachable code or unused variables
12. Logging over silent failure — log failures, never silently ignore them

For each violation found, mention:
- Which technique is violated (by number and name)
- Which line or code snippet is the problem
- A suggested fix

Be concise and direct. Format your response in clean markdown.
`;

async function run() {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
    const prNumber = parseInt(process.env.PR_NUMBER);

    // Get the PR diff
    const { data: files } = await octokit.pulls.listFiles({
        owner,
        repo,
        pull_number: prNumber,
    });

    // Build a readable diff string
    let diffContent = "";
    for (const file of files) {
        diffContent += `\n\n### File: ${file.filename}\n\`\`\`\n${file.patch}\n\`\`\``;
    }

    if (!diffContent.trim()) {
        console.log("No diff found, skipping review.");
        return;
    }

    // Ask Claude to review
    const message = await anthropic.messages.create({
        model: "claude-opus-4-6",
        max_tokens: 2048,
        messages: [
            {
                role: "user",
                content: `${DEFENSIVE_CODING_PROMPT}\n\nHere is the code diff to review:\n${diffContent}`,
            },
        ],
    });

    const review = message.content[0].text;

    // Post the review as a PR comment
    await octokit.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body: `## 🤖 AI PR Review — Defensive Coding Analysis\n\n${review}`,
    });

    console.log("Review posted successfully!");
}

run().catch((err) => {
    console.error(err);
    process.exit(1);
});