import Database from "src/utils/Database"

async function test() {
    console.log(await Database.getUser("297798128340566016"));
    let d: User = {
        uid: "219567389761601536",
        balance: 0
    };
    await Database.createUser(d);
}

test();