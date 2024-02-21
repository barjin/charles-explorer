package database

import (
	"database/sql"
	"fmt"
	"strings"
	"sync"

	_ "github.com/mattn/go-sqlite3"
)

/*
An utility type abstracting the database connection.
*/
type Database struct {
	db *sql.DB
}

func ConnectToDatabase(databasePath string) Database {
	fmt.Println("Connecting to the database...")
	if db, err := sql.Open("sqlite3", databasePath); err != nil {
		panic(err)
	} else {
		fmt.Println("Connected to the database!")
		return Database{db: db}
	}
}

/*
Closes the database connection.
*/
func (db *Database) Close() {
	db.db.Close()
}

/*
A type representing a "prepared" query to the database.
Note that "prepared" here doesn't mean that the query is precompiled, but rather that it is ready to be executed
and has the database connection already set up.
*/
type Query struct {
	// `true` if the query has been fully executed (all the results have been read).
	done bool
	// Returns a channel of results and a flag indicating whether the query has been fully executed.
	GetResultsChannel func() (chan []string, bool)
}

func (db *Database) NewQuery(query string, batchSize uint64) Query {
	var offset uint64 = 0

	q := Query{done: false}
	statement, err := db.db.Prepare(query)
	if err != nil {
		panic(err)
	}

	results := make(chan []string, batchSize)
	done := false

	GetResultsChannel := func() (chan []string, bool) {
		go func() {
			for !done {
				currentOffset := offset
				offset += batchSize

				rows, err := statement.Query(batchSize, currentOffset)

				if err != nil {
					panic(err)
				}

				readRows := 0

				for rows.Next() {
					readRows++
					var A string
					var B string
					rows.Scan(&A, &B)
					results <- []string{A, B}
				}

				rows.Close()

				if readRows < int(batchSize) {
					break
				}
			}

			done = true
			close(results)
		}()

		return results, done
	}

	q.GetResultsChannel = GetResultsChannel
	return q
}

func (db *Database) GetValue(query string) string {
	row := db.db.QueryRow(query)
	var value string
	row.Scan(&value)
	return value
}

func (db *Database) insert(tableName string, columns []string, values [][]string) {
	columnsString := ""
	for i, column := range columns {
		if i > 0 {
			columnsString += ", "
		}
		columnsString += "\""
		columnsString += column
		columnsString += "\""
	}

	valuesString := ""

	firstRow := true

	for _, row := range values {
		if len(row) == 0 {
			continue
		}
		if !firstRow {
			valuesString += ", "
		}
		valuesString += "("
		for j, value := range row {
			if j > 0 {
				valuesString += ", "
			}
			valuesString += "'"
			valuesString += strings.ReplaceAll(value, "'", "''")
			valuesString += "'"
		}
		valuesString += ")"
		firstRow = false
	}

	query := fmt.Sprintf("INSERT INTO %s (%s) VALUES %s;", tableName, columnsString, valuesString)

	_, err := db.db.Exec(query)

	if err != nil {
		panic(err)
	}
}

func (db *Database) GetInsertChannel(tableName string, bufferSize uint16, wg *sync.WaitGroup, columns ...string) chan []string {
	insertChan := make(chan []string)
	buffer := make([][]string, bufferSize)
	buffer = buffer[:0]

	go func() {
		for row := range insertChan {
			buffer = append(buffer, row)
			if len(buffer) >= int(bufferSize) {
				db.insert(tableName, columns, buffer)
				buffer = buffer[:0]
			}
		}

		fmt.Println("I'm done!")
		if len(buffer) > 0 {
			db.insert(tableName, columns, buffer)
		}

		wg.Done()
	}()

	return insertChan
}
