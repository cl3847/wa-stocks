import Database from "utils/Database"

async function test() {
    console.log(await Database.getUser("219567389761601536"));
}

test()