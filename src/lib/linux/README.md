# SYS/LAB Terminal 2.0 — incremental development

Branch: feature/linux-terminal-v2. The new shell is connected to **LAB-01 / Linux Basics** in the feature branch.
LAB-02 Network Repair and LAB-03 Service Recovery continue using the original simulator.
Existing syslab-lab-states-v1 browser saves are migrated on the first new Linux command;
progress and other scenarios keep their original persistent storage keys.

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
3. Improve persistence limits and finish the V2 migration strategy.
4. Extend V2 to additional scenarios only after preserving their task checks.
5. Add system/network/service simulation and expand toward 160 commands.

**Important:** Never run user-entered commands via eval, child_process, a real shell
or HTTP requests from a visitor's browser. This is only a local simulated system.
