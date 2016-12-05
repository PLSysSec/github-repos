#!/usr/bin/env node
const commander = require('commander');
const shell     = require('shelljs');
const async     = require('async');
const GitHubApi = require('github');

const github = new GitHubApi({
  protocol: "https",
  host: "api.github.com",
  headers: {
    "user-agent": "Clone4Pown"
  },
  timeout: 5000
});


commander.version(require('./package.json').version)
         .description('Clone github repos');

commander.command('list-org [org-name]')
         .description('List all repos for organization')
         .option('-u, --url', 'Show URL')
         .action(orgList);

commander.command('list-user [user-name]')
         .description('List all repos for user')
         .option('-u, --url', 'Show URL')
         .action(userList);

commander.command('clone-org [org-name]')
         .option('-e, --exclude [repo-name]',
                 'Exclude repository',
                 (v, acc) => { acc.push(v); return acc;}, [])
         .option('--out [dir]', 'Output directory. defaults to current working directory')
         .description('Clone organization repositories')
         .action(orgClone);

commander.command('clone-user [user-name]')
         .option('-e, --exclude [repo-name]',
                 'Exclude repository',
                 (v, acc) => { acc.push(v); return acc;}, [])
         .option('--out [dir]', 'Output directory. defaults to current working directory')
         .description('Clone user repositories')
         .action(userClone);

commander.parse(process.argv);

if (!commander.args.length) {
  commander.help();
}

function processUserOrOrgArgs(userOrOrg, opts) {
  if(!userOrOrg) {
    commander.help();
    process.exit(-1);
  }
  return {
    name: userOrOrg,
    exclude: opts.exclude || [],
    outDir: opts.out || process.cwd(),
  };
}

function userList(user, opts) {
  list(opts.url, cb => {
    return github.repos.getForUser({
      username: user,
      per_page: 100
    }, cb);
  });
}

function orgList(org, opts) {
  list(opts.url, cb => {
    return github.repos.getForOrg({
      org: org,
      per_page: 100
    }, cb);
  });
}
  
function list(showUrl, getRepos) {
  getRepos((err, repos) => {
    if (err) {
      throw err;
    }
    repos.sort( (a, b) => {
      return (a.name < b.name) ? -1 : 1;
    }).forEach(repo => {
      if (showUrl) {
        console.log(`${repo.name} ${repo.url}`);
      } else {
        console.log(repo.name);
      }
    });
  });
}

// clone

function userClone(user, opts) {
  const obj = processUserOrOrgArgs(user, opts);
  return clone(obj, (cb) => {
    return github.repos.getForUser({
      username: user,
      per_page: 100
    }, cb);
  });
}

function orgClone(org, opts) {
  const obj = processUserOrOrgArgs(org, opts);
  return clone(obj, (cb) => {
    return github.repos.getForOrg({
      org: org,
      per_page: 100
    }, cb);
  });
}

function clone(obj, getRepos) {

  const outDir       = obj.outDir;
  const name         = obj.name;
  const excludeRepos = obj.exclude;

  shell.cd(outDir);
  shell.mkdir(name); shell.cd(name);
  shell.ShellString(process.argv.join(' ')).toEnd('history');

  getRepos((err, repos) => {
    if (err) {
      throw err;
    }
    shell.ShellString(JSON.stringify(repos)).to('repos.info');

    const cloneThunks = repos.filter(repo => excludeRepos.indexOf(repo.name) === -1).map(repo => {
      return (cb) => {
        console.log(`Cloning ${repo.name}`);
        shell.exec(`git clone ${repo.clone_url}`, (code, stdout, stderr) => {
          if (code !== 0) {
            console.error(`Cloning ${repo.clone_url} failed`);
          }
          cb(null);
        });
      }
    });

    async.parallel(cloneThunks, (err, res) => {
      if (err) {
        throw err;
      }
      console.log('DONE!');
    });
  });
}
