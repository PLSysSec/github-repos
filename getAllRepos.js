#!/usr/bin/env node
const shell     = require('shelljs');
const GitHubApi = require('github');

if (process.argv.length !== 3) {
  throw new Error('Usage: getAllRepos.js <org-name>');
}
const org = process.argv[2];

const github = new GitHubApi({
    protocol: "https",
    host: "api.github.com", // should be api.github.com for GitHub 
    headers: {
        "user-agent": "Hello-World" // GitHub is happy with a unique user agent 
    },
    timeout: 5000
});


shell.mkdir(org);
shell.cd(org);

github.repos.getForOrg({
  org: org,
  per_page: 100
}, (err, repos) => {
  if (err) {
    throw err;
  }

  repos.forEach(repo => {
    shell.exec(`git clone ${repo.clone_url}`, {async:true});
  });
});
