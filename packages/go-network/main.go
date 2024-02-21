package main

import (
	"fmt"
	"net/http"
	socialNetwork "network-analyzer/internal/socialNetwork"
	"strings"
)

type Operator string

const (
	AND  Operator = "AND"
	OR   Operator = "OR"
	ONLY Operator = "ONLY"
)

func main() {
	network := socialNetwork.NewSocialNetwork("./graph.db")

	blankNetwork := socialNetwork.SocialNetwork{}

	if network == nil {
		fmt.Println("Error creating social network")
		return
	}

	http.HandleFunc("/graph", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Header().Set("Access-Control-Allow-Origin", "*")
		w.Header().Set("Expires", "Thu, 05 Apr 2063 12:00:00 GMT")

		op := Operator(r.URL.Query().Get("op"))
		if op == "" {
			op = "OR"
		}

		nodeInput := r.URL.Query().Get("node")
		if nodeInput == "" {
			fmt.Fprint(w, blankNetwork.ToJSON())
			return
		}
		nodeIds := strings.Split(nodeInput, ",")

		seeds := make([]socialNetwork.Node, 0)

		for _, nodeId := range nodeIds {
			node, found := network.GetNode(nodeId)

			if found {
				seeds = append(seeds, node)
			}
		}

		nodes := make([]socialNetwork.Node, 0)

		if op == OR {
			for _, node := range seeds {
				fmt.Println(node)

				nodes = append(nodes, node)
				nodes = append(nodes, node.GetConnectedNodes()...)
			}
		}

		if op == AND {
			nodes = append(seeds[0].GetConnectedNodes(), seeds[0])
			for _, node := range seeds[1:] {
				nodes = socialNetwork.CommonNodes(nodes, append(node.GetConnectedNodes(), node))
			}
		}

		if op == ONLY {
			nodes = seeds
		}

		nodes = socialNetwork.UniqueNodes(nodes)
		network.InjectPublicIdsToNodes(nodes)
		edges := network.GetEdgesOnNodes(nodes)

		result := socialNetwork.SocialNetwork{Nodes: nodes, Edges: edges}

		fmt.Fprint(w, result.ToJSON())
	})
	fmt.Println("Server started at :8899")

	http.ListenAndServe(":8899", nil)
}
