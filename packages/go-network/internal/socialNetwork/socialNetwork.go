package socialNetwork

import (
	"database/sql"
	"fmt"
	"network-analyzer/internal/utils"

	_ "github.com/mattn/go-sqlite3"
)

type SocialNetwork struct {
	backend *sql.DB

	Nodes []Node
	Edges []Edge
}

func NewSocialNetwork(sqlitePathName string) *SocialNetwork {
	backend, err := sql.Open("sqlite3", sqlitePathName)

	if err != nil {
		fmt.Printf("Error opening SQLite database: %s\n", err)
		return nil
	}

	return &SocialNetwork{backend: backend}
}

func (network *SocialNetwork) GetNode(publicId string) (Node, bool) {
	internalId := network.getInternalNodeId(publicId)

	if internalId == 0 {
		return Node{}, false
	}

	return Node{network: network, internalId: internalId}, true
}

func (network *SocialNetwork) GetEdgesOnNodes(nodes []Node) []Edge {
	nodeMap := make(map[uint32]Node)

	for _, node := range nodes {
		nodeMap[node.internalId] = node
	}

	edges := []Edge{}

	ids := make([]uint32, len(nodes))
	for i, node := range nodes {
		ids[i] = node.internalId
	}

	idRange := ""

	for i, id := range ids {
		if i != 0 {
			idRange += ", "
		}
		idRange += fmt.Sprintf("%d", id)
	}

	query := fmt.Sprintf(`SELECT "FROM", "TO", WEIGHT
	FROM EDGES
	WHERE "FROM" IN (%s)
	AND "TO" IN (%s)`, idRange, idRange)

	q, err := network.backend.Query(query)

	if err != nil {
		return edges
	}

	for q.Next() {
		var from uint32
		var to uint32
		var weight uint16
		q.Scan(&from, &to, &weight)

		edges = append(edges, Edge{
			FromInternalId: from,
			ToInternalId:   to,
			From:           nodeMap[from].publicId,
			To:             nodeMap[to].publicId,
			Weight:         int(weight),
		})
	}

	return edges
}

func (network *SocialNetwork) getInternalNodeId(publicId string) uint32 {
	row := network.backend.QueryRow("SELECT ID FROM NODES WHERE PERSON_ID = ?", publicId)

	var id uint32
	row.Scan(&id)

	return id
}

func (network *SocialNetwork) InjectPublicIdsToNodes(nodes []Node) {
	ids := make([]uint32, len(nodes))
	for i, node := range nodes {
		ids[i] = node.internalId
	}

	idRange := ""

	for i, id := range ids {
		if i != 0 {
			idRange += ", "
		}
		idRange += fmt.Sprintf("%d", id)
	}

	query := fmt.Sprintf(`SELECT PERSON_ID, ID
	FROM NODES
	WHERE ID IN (%s)`, idRange)

	q, err := network.backend.Query(query)

	if err != nil {
		return
	}

	for q.Next() {
		var personId string
		var internalId uint32
		q.Scan(&personId, &internalId)

		for i, node := range nodes {
			if node.internalId == internalId {
				nodes[i].publicId = personId
			}
		}
	}
}

func (network *SocialNetwork) ToJSON() string {
	nodesJson := []string{}
	for _, node := range network.Nodes {
		nodesJson = append(nodesJson, node.JSON())
	}

	edgesJson := []string{}
	for _, edge := range network.Edges {
		edgesJson = append(edgesJson, edge.JSON())
	}

	return fmt.Sprint("{ \"nodes\": [", utils.Join(nodesJson, ", "), "], \"edges\": [", utils.Join(edgesJson, ", "), "] }")
}

func (network *SocialNetwork) Close() {
	network.backend.Close()
}
