import pg from 'pg';

const table = [
    {
        'id':1,
        'tableName':'student',
        'query': 'CREATE TABLE IF NOT EXISTS student (id SERIAL, name VARCHAR (255) NOT NULL, PRIMARY KEY (id));',
        'seedConfig': {
            'recordsCount':100000
        }
    },
    {
        'id':1,
        'tableName':'score',
        'query': 'CREATE TABLE IF NOT EXISTS score (id SERIAL, score INT NOT NULL, student_id int NOT NULL,PRIMARY KEY (id), FOREIGN KEY (student_id) REFERENCES student(id));',
        'seedConfig': {
            'recordsCount':100000
        }
    }
]

const scenario = [
    {
        'id':1,
        'query':'SELECT name FROM student where id = 10000;',
        'outputConstraints': {
            name: {
                presence: true,
            }
        }
    }
]


async function initializeDatabase(client){
    let countTable = table.length

    for(let i = 0; i < countTable; i++){
        await client.query(table[i].query)
    }
}

async function seedData(client){
    let countTable = table.length

    for(let i = 0; i < countTable; i++){
        const output = await client.query(`SELECT column_name, udt_name, character_maximum_length
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name   = $1;`, [table[i].tableName])

        const countColumn = output.rowCount
        const column = output.rows
        const recordsCount = table[i].seedConfig.recordsCount

        const seedBlocks = []

        
        for(let j = 0; j < countColumn; j++){
            if(column[j].column_name == 'id' && `${column[j].udt_name}`.match('int*')){
                seedBlocks.push(`generate_series(1, ${recordsCount})`)
            } else if (`${column[j].udt_name}`.match('int*')){
                seedBlocks.push(`floor(random() * 10000) + 1`)
            } else if (column[j].udt_name == 'varchar'){
                seedBlocks.push(`'default'`)
            }
        }

        let seedDataQuery = `INSERT INTO ${table[i].tableName} (${column.map((o) => o.column_name).toString()}) VALUES (${seedBlocks.toString()})`

        console.log(seedDataQuery)
        await client.query(seedDataQuery)
    }
}

async function main(){
    const client = new pg.Client({
        host: 'localhost',
        port:5432,
        password: 'postgres',
        user:'postgres',
        database: 'test'
    })

    await client.connect()

    await initializeDatabase(client)

    await seedData(client)
}

main().catch((err) => console.log(err)).finally()