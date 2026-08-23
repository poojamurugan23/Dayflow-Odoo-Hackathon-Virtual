const { execSync } = require('child_process');
const commits = [
  { hash: '03be8a8e462e8f763a3b2d849a0523506756844c', date: '2026-08-22T12:00:00' },
  { hash: 'fc38fb1c7a8c385cd340916530ee45e99834db94', date: '2026-08-22T13:00:00' },
  { hash: '8e137c322cfbf42976a3291d0fb19032ba3fd1bf', date: '2026-08-22T14:00:00' },
  { hash: '193623c9c19a3bfabe41420b01e3dafda552bf71', date: '2026-08-22T15:00:00' },
  { hash: 'bbd99c118cfc3002087377e05fafd73d4867427f', date: '2026-08-22T16:00:00' },
  { hash: '8c09976f2f40c8fc0db2487b9cdf95c89b26e176', date: '2026-08-22T17:00:00' },
  { hash: 'ab53cb7ebeb78c7aa4067cdfb76f297781a7eee0', date: '2026-08-22T18:00:00' },
  { hash: '999f06c5baa1fe65e4f433607406e272782a4998', date: '2026-08-22T19:00:00' },
  { hash: 'bf032b6043e3afa7188c9255407a74488d610c1a', date: '2026-08-22T20:00:00' }
];
try {
  execSync('git reset --hard 5114f5c7dec8711dec81d0bb196eafa1c9f8a188', { stdio: 'inherit' });
  for (const commit of commits) {
    execSync('git cherry-pick --allow-empty-message ' + commit.hash, { env: { ...process.env, GIT_COMMITTER_DATE: commit.date, GIT_AUTHOR_DATE: commit.date }, stdio: 'inherit' });
    execSync('git commit --amend --no-edit --allow-empty-message --date=\"' + commit.date + '\"', { env: { ...process.env, GIT_COMMITTER_DATE: commit.date }, stdio: 'inherit' });
  }
  execSync('git push origin main --force', { stdio: 'inherit' });
} catch (e) {
  console.error(e);
}
