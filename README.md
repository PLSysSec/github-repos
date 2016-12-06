# About

Super simple throwaway script for fetching all the repositories of a github org
or user.

# Install

```
npm i -g github-repos
```

# List examples

Get the list of repos:

```
github-repos list-org plsyssec
```

Get list of repos, their URLs and main language:

```
github-repos list-user deian --url --lang
```

# Clone examples

Clone all repos but `github-repos`

```
github-repos clone-org plsyssec --exclude github-repos --out /tmp/
```

Clone all JavaScript repos except `github-repos` and `lio`

```
github-repos clone-user deian --exclude lio --exclude github-repos --out /tmp/ --only-lang javascript
```

# Addressing rate limits

GitHub rate limits public IPs. You may need to generate an access token to lift
some of this. Get a token (with no scope) from:
<https://github.com/settings/tokens> and set the token as the `GITHUB_TOKEN`
environment variable.
