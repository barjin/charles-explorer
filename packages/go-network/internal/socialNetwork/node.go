package socialNetwork

type Node struct {
	network    *SocialNetwork
	internalId uint32
	publicId   string
}

func (node *Node) GetConnectedNodes() []Node {
	query, err := node.network.backend.Query(`
SELECT "TO", WEIGHT 
	from 
EDGES 
	WHERE 
		"FROM" == ? 
UNION 
SELECT "FROM", WEIGHT 
	from 
EDGES 
	WHERE 
		"TO" == ?`, node.internalId, node.internalId)

	if err != nil {
		return []Node{}
	}

	var neighborhood []Node
	for query.Next() {
		var to uint32
		var weight uint16
		query.Scan(&to, &weight)

		neighborhood = append(neighborhood, Node{network: node.network, internalId: to})
	}

	return neighborhood
}

func (node *Node) JSON() string {
	return `{
		"id": "` + node.publicId + `"
	}`
}

func UniqueNodes(nodes []Node) []Node {
	unique := []Node{}
	seen := map[uint32]bool{}

	for _, node := range nodes {
		if _, found := seen[node.internalId]; !found {
			seen[node.internalId] = true
			unique = append(unique, node)
		}
	}

	return unique
}

func CommonNodes(a []Node, b []Node) []Node {
	common := []Node{}
	seen := map[uint32]bool{}

	for _, node := range a {
		seen[node.internalId] = true
	}

	for _, node := range b {
		if _, found := seen[node.internalId]; found {
			common = append(common, node)
		}
	}

	return common
}
