#!/usr/bin/env node

import { access } from "node:fs/promises";
import { spawn } from "node:child_process";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const defaultCliPath = "/Applications/wechatwebdevtools.app/Contents/MacOS/cli";
const defaultProjectPath = resolve("apps/miniprogram");
const defaultDeployRoot = resolve("cloud/functions/deploy");
const requiredDeployFiles = ["index.js", "runtime.js", "package.json", "config.json"];
const deployFunctionNames = [
  "listActivities",
  "getActivityDetail",
  "listMyRegistrations",
  "signupActivity",
  "cancelRegistration",
  "joinWaitlist",
  "cancelWaitlist",
  "confirmArrival",
  "confirmSettlement",
  "getJuZhangWorkspace",
  "respondJuZhangAssignment",
  "submitFeedback",
  "getFeedbackCompletionState",
];

export function readFlagValue(args, flagName) {
  const index = args.indexOf(flagName);

  if (index < 0) {
    return undefined;
  }

  const value = args[index + 1];

  return value && !value.startsWith("--") ? value : undefined;
}

function quoteShellArg(value) {
  return /^[A-Za-z0-9_./:=@-]+$/.test(value) ? value : `'${value.replaceAll("'", "'\\''")}'`;
}

export function getDeployFunctionNames() {
  return [...deployFunctionNames];
}

export function createDeployCommand({
  cliPath = defaultCliPath,
  deployRoot = defaultDeployRoot,
  envId,
  projectPath = defaultProjectPath,
  functionNames = deployFunctionNames,
}) {
  return [
    cliPath,
    "cloud",
    "functions",
    "deploy",
    "--env",
    envId,
    "--project",
    projectPath,
    "--remote-npm-install",
    "--paths",
    ...functionNames.map((functionName) => resolve(deployRoot, functionName)),
  ];
}

export function createDeployPlan({
  envId = process.env.WECHAT_CLOUD_ENV_ID ?? "",
  cliPath = defaultCliPath,
  deployRoot = defaultDeployRoot,
  projectPath = defaultProjectPath,
  functionNames = deployFunctionNames,
} = {}) {
  if (!envId.trim()) {
    throw new Error("WECHAT_CLOUD_ENV_ID is required");
  }

  const command = createDeployCommand({
    cliPath,
    deployRoot,
    envId,
    projectPath,
    functionNames,
  });

  return {
    command,
    functionNames: [...functionNames],
    shellCommand: command.map(quoteShellArg).join(" "),
  };
}

export async function validateDeployPackages(deployRoot = defaultDeployRoot, functionNames = deployFunctionNames) {
  for (const functionName of functionNames) {
    for (const fileName of requiredDeployFiles) {
      try {
        await access(resolve(deployRoot, functionName, fileName));
      } catch {
        throw new Error(`${functionName} is missing ${fileName}`);
      }
    }
  }
}

export function isDirectRun(moduleUrl, argvPath, cwd = process.cwd()) {
  if (!argvPath) {
    return false;
  }

  return fileURLToPath(moduleUrl) === resolve(cwd, argvPath);
}

function runCommand(command) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command[0], command.slice(1), { stdio: "inherit" });

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolvePromise();
        return;
      }

      reject(new Error(`WeChat cloud deploy failed with exit code ${code}`));
    });
  });
}

async function main() {
  const args = process.argv.slice(2);
  const envId = readFlagValue(args, "--env") ?? process.env.WECHAT_CLOUD_ENV_ID ?? "";
  const cliPath = readFlagValue(args, "--cli") ?? defaultCliPath;
  const projectPath = readFlagValue(args, "--project") ?? defaultProjectPath;
  const deployRoot = readFlagValue(args, "--deploy-root") ?? defaultDeployRoot;
  const shouldExecute = args.includes("--execute");
  const plan = createDeployPlan({ envId, cliPath, projectPath });

  await validateDeployPackages(deployRoot, plan.functionNames);

  console.log(`Cloud environment: ${envId}`);
  console.log(`Project: ${projectPath}`);
  console.log(`Deploy root: ${deployRoot}`);
  console.log(`Functions: ${plan.functionNames.join(", ")}`);
  console.log(`Command: ${plan.shellCommand}`);

  if (!shouldExecute) {
    console.log("Dry run only. Add --execute to deploy.");
    return;
  }

  await runCommand(plan.command);
}

if (isDirectRun(import.meta.url, process.argv[1])) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
