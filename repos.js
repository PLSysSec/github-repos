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

if (process.env['GITHUB_TOKEN']) {
  github.authenticate({
    type: "token",
    token: process.env['GITHUB_TOKEN']
  });
}

commander.version(require('./package.json').version)
         .description('Clone github repos');

commander.command('list-org [org-name]')
         .description('List all repos for organization')
         .option('-u, --url', 'Show URL')
         .option('-l, --lang', 'Show language')
         .action(orgList);

commander.command('list-user [user-name]')
         .description('List all repos for user')
         .option('-u, --url', 'Show URL')
         .option('-l, --lang', 'Show language')
         .action(userList);

commander.command('clone-org [org-name]')
         .option('-e, --exclude [repo-name]',
                 'Exclude repository',
                 (v, acc) => { acc.push(v); return acc;}, [])
         .option('--out [dir]', 'Output directory. defaults to current working directory')
         .option('-l, --lang [lang]', 
                 'Limit cloning to repos of certain language(s)',
                 (v, acc) => { acc.push(v); return acc;}, [])
         .description('Clone organization repositories')
         .action(orgClone);

commander.command('clone-user [user-name]')
         .option('-e, --exclude [repo-name]',
                 'Exclude repository',
                 (v, acc) => { acc.push(v); return acc;}, [])
         .option('--out [dir]', 'Output directory. defaults to current working directory')
         .option('-l, --lang [lang]', 
                 'Limit cloning to repos of certain language(s)',
                 (v, acc) => { acc.push(v); return acc;}, [])
         .description('Clone user repositories')
         .action(userClone);

commander.parse(process.argv);

if (!commander.args.length) {
  commander.help();
}

// heper for getFor{User, Org} that goes through all the pages and concatenates
// the repos
function mkGetRepos(callback) {
  let repos = [];
  const getRepos = (err, res) => {
    if (err) {
      callback(err, repos);
    }

    repos = repos.concat(res);
    if (github.hasNextPage(res)) {
      github.getNextPage(res, getRepos)
    } else {
      callback(null, repos);
    }
  }
  return getRepos;
}

// get all user repos
function getForUser(user, callback) {
  const getRepos = mkGetRepos(callback);
  github.repos.getForUser({
    username: user,
    per_page: 100
  }, getRepos);
};

// get all org repos
function getForOrg(org, callback) {
  const getRepos = mkGetRepos(callback);
  github.repos.getForOrg({
    org: org,
    per_page: 100
  }, getRepos);
};


function processUserOrOrgArgs(userOrOrg, opts) {
  if(!userOrOrg) {
    commander.help();
    process.exit(-1);
  }
  return {
    name: userOrOrg,
    exclude: opts.exclude || [],
    outDir: opts.out || process.cwd(),
    langs: opts.lang || []
  };
}

function userList(user, opts) {
  list(opts, cb => {
    return getForUser(user, cb);
  });
}

function orgList(org, opts) {
  list(opts, cb => {
    return getForOrg(org, cb);
  });
}
  
function list(opts, getRepos) {
  getRepos((err, repos) => {
    if (err) {
      throw err;
    }
    repos.sort( (a, b) => {
      return (a.name < b.name) ? -1 : 1;
    }).forEach(repo => {
      let str = repo.name;
      if (opts.lang) {
        str += ` ${repo.language}`;
      }
      if (opts.url) {
        str += ` ${repo.url}`;
      }
      console.log(str);
    });
  });
}

// clone

function userClone(user, opts) {
  const obj = processUserOrOrgArgs(user, opts);
  return clone(obj, (cb) => {
    return getForUser(user, cb);
  });
}

function orgClone(org, opts) {
  const obj = processUserOrOrgArgs(org, opts);
  return clone(obj, (cb) => {
    return getForOrg(org, cb);
  });
}

function clone(obj, getRepos) {

  const outDir       = obj.outDir;
  const name         = obj.name;
  const excludeRepos = obj.exclude.map(n => n.toLowerCase());
  const langs        = obj.langs.map(n => n.toLowerCase());

  shell.cd(outDir);
  shell.mkdir(name); shell.cd(name);
  shell.ShellString(process.argv.join(' ')).toEnd('history');

  getRepos((err, repos) => {
    if (err) {
      throw err;
    }
    shell.ShellString(JSON.stringify(repos)).to('repos.info');

    const filter = (repo) => {
      const name = repo.name.toLowerCase();
      if(excludeRepos.indexOf(name) !== -1) {
        return false; // don't include excluded repos
      }
      if (langs.length > 0) {
        // if we don't have language, just err on the side of cloning more
        return (repo.language === null) ||
          (langs.indexOf(repo.language.toLowerCase()) !== -1);
      }
      return true;
    };

    const cloneThunks = repos.filter(filter).map(repo => {
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
