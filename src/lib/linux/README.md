# SYS/LAB Terminal 2.0 — incremental development

Branch: feature/linux-terminal-v2. This module is **not yet connected** to the existing LAB UI.
The production simulator in src/lib/labEngine.ts and its saves remain untouched.

## Batch 1: filesystem and shell foundation
- JSON-serializable, in-memory virtual filesystem; no real Linux subprocess.
- Initial directory structure: /, /home/student, /etc, /tmp, /var, /usr.
- Files exist across different commands within the same VirtualTerminalState.
- The user can write to /home/student and /tmp only; core directories are protected.
- File limit: 65,536 characters each; 2,000 total nodes.
- Initial 22 commands: pwd, whoami, hostname, help, clear, cd, ls, mkdir, touch, cat,
  echo, cp, mv, rm, rmdir, head, tail, wc, find, tree, stat, grep.
- Supported shell operators: quoted arguments, &&, >, >>. Pipe support is **not** included yet.

### Run tests
The test suite requires Node 22:
~~~sh
node --experimental-strip-types --test src/lib/linux/terminal.test.ts
npm run build
~~~

## Next batches
1. Fix test findings and add command registry plus permission model.
2. Add pipes, globbing, environment variables and multi-line text tools.
3. Build persistence with versioned migration from the legacy lab state.
4. Connect the engine to Lab.tsx behind an opt-in flag, preserve the original scenarios.
5. Add system/network/service simulation and expand toward 160 commands.

**Important:** Never run user-entered commands via eval, child_process, a real shell
or HTTP requests from a visitor's browser. This is only a local simulated system.
