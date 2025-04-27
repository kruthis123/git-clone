import * as fs from 'fs';
import executeCatFile from './cat-file';
import executeHashObject from './hash-object';
import executeLsTree from './ls-tree';
import executeWriteTree from './write-tree';

const args = process.argv.slice(2);
const command = args[0];

enum Commands {
    Init = "init",
    CatFile = "cat-file",
    HashObject = "hash-object",
    LsTree = "ls-tree",
    WriteTree = "write-tree",
};

switch (command) {
    case Commands.Init:
        // You can use print statements as follows for debugging, they'll be visible when running tests.
        console.error("Logs from your program will appear here!");

        // Uncomment this block to pass the first stage
        fs.mkdirSync(".git", { recursive: true });
        fs.mkdirSync(".git/objects", { recursive: true });
        fs.mkdirSync(".git/refs", { recursive: true });
        fs.writeFileSync(".git/HEAD", "ref: refs/heads/main\n");
        console.log("Initialized git directory");
        break;
    case Commands.CatFile:
        executeCatFile(args[1], args[2]);
        break;
    case Commands.HashObject:
        if (args[2] && args[1] == '-w') {
            executeHashObject(args[2], true);
        } else {
            executeHashObject(args[1]);
        }
        break;
    case Commands.LsTree:
        if (args[2] && args[1] == '--name-only') {
            executeLsTree(args[2], true);
        } else {
            executeLsTree(args[1]);
        }
        break;
    case Commands.WriteTree:
        console.log(await executeWriteTree('.'));
        break;
    default:
        throw new Error(`Unknown command ${command}`);
}
