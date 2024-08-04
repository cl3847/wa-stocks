interface Request {
    level_id: string;
    bounty: number;
    name?: string;
    creator?: string;
    requester_uid?: string;
}

export default Request;