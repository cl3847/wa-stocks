import Database from "src/utils/Database"

async function test() {
    console.log(await Database.getUser("297798128340566016"));
}

test()