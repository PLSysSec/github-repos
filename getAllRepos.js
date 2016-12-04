#!/usr/bin/env node
if (process.argv.length !== 3) {
  throw new Error('Usage: getAllRepos.js <org-name>');
}
const org = process.argv[2];
const GitHubApi = require('github');
const github = new GitHubApi({
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub 
    headers: {
        "user-agent": "Hello-World" // GitHub is happy with a unique user agent 
    },
    timeout: 5000
});


github.repos.getForOrg({
  org: org,
  per_page: 100
}, (err, repos) => {
  if (err) {
    throw err;
  }

  repos.forEach(repo => {
    console.log(repo.clone_url);
  });
});
