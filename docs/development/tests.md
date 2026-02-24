---
title: Tests
---

**Note:** elasticseach 6 is required for running the tests

#### Test all of the packages

```sh
pnpm test
```

#### Test a single package

```sh
cd packages/[package-name];
pnpm test
```

#### Test a single file

```sh
cd packages/[package-name];
pnpm test --testPathPatterns 'example-spec'
```

#### Test a single file expectation

```sh
cd packages/[package-name];
pnpm test --testPathPatterns 'example-spec' -t 'should output hello world'
```

#### Test a single package in debug mode

```sh
cd packages/[package-name];
pnpm test:debug
# or with a different debug scope
env DEBUG='*execution-controller*' pnpm test:debug
```

#### Test a single package in watch mode

```sh
cd packages/[package-name];
pnpm test:watch
```

### Attaching a Debugger to Jest within `ts-scripts`

To debug Jest tests launched through `ts-scripts`, set the `ATTACH_JEST_DEBUGGER` environment variable to start Jest in Node.js debug mode. This will allow for `debugger` statements to work and enable the developer to go line by line within vscode.

#### 1. Enable Node Debugger

Run your test command with the debugger flag:

```bash
ATTACH_JEST_DEBUGGER=true pnpm test
```

---

#### 2. Configure VS Code

Create or edit your `.vscode/launch.json` file with the following:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "attach",
      "name": "Attach to Jest Fork in ts-scripts",
      "port": 9230,
      "restart": true
    }
  ]
}
```

Learn more about debugging node.js in vscode Here:
[Debugging node.js in vscode](https://code.visualstudio.com/docs/nodejs/nodejs-debugging)

---

#### 3. Attach from VS Code

1. Open the **Run and Debug** panel in VS Code.
2. Choose **Attach to Jest Fork in ts-scripts** from the dropdown.
3. Press the green **Start Debugging** ▶️ button.

VS Code will attach to the Jest process paused at the first line.

---

#### 4. How It Works

- The `ATTACH_JEST_DEBUGGER` flag tells `ts-scripts` to add `--inspect-brk=9230` when spawning Jest.
- Jest pauses execution until a debugger connects.
- VScode connects to the process using the settings in `launch.json`.

---
