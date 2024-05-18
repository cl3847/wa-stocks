import DatabaseHandler from "src/handlers/DatabaseHandler"

async function test() {
    let db = DatabaseHandler.getInstance();
    console.log(await db.user.getUser("160780013317128193"));
    console.log(await db.user.deleteUser("160780013317128193"));
    console.log(await db.user.getUser("160780013317128193"));
}

test();