function parseLevelString(text: string): Level {
    const parts = text.split(":");
    return {
        id: parts[1]!,
        name: parts[3]!,
        creator: parts[54]!,
    };
}

async function getLevel(levelId: string): Promise<Level | null> {
    const headers = {
        "User-Agent": "",
    };
    const data = {
        "str": levelId,
        "star": "1",
        "type": "0",
        "secret": "Wmfd2893gb7",
    };
    const url = "http://www.boomlings.com/database/getGJLevels21.php";

    try {
        const req = await fetch(url, {
            method: "POST",
            headers: headers,
            body: new URLSearchParams(data),
        });
        const text = await req.text();
        if (text === "-1") return null;
        else return parseLevelString(text);
    } catch (err) {
        console.error(err);
        return null;
    }
}

export {
    getLevel
}