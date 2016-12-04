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

Get list of repos and their URLs:

```
github-repos list-user deian --url
```

# Clone examples

Clone all repos but `github-repos`

```
github-repos clone-org plsyssec --exclude github-repos --out /tmp/
```

Clone all repos except `github-repos` and `lio`

```
github-repos clone-user deian --exclude lio --exclude github-repos --out /tmp/
```
