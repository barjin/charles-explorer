package socialNetwork

import "fmt"

type Edge struct {
	From           string
	To             string
	FromInternalId uint32
	ToInternalId   uint32
	Weight         int
}

func (edge *Edge) JSON() string {
	return `{
	"from": "` + edge.From + `",
	"to": "` + edge.To + `",
	"weight": ` + fmt.Sprint(edge.Weight) + `
}`
}
