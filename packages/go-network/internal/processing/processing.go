package processing

type AuthorAuthor struct {
	FirstAuthor  string
	SecondAuthor string
}

type Author struct {
	Id      string
	Friends map[string]uint16
}

func CountCollaborations(collaborations <-chan AuthorAuthor, out chan<- Author) {
	author := Author{}
	for collaboration := range collaborations {
		if author.Id != collaboration.FirstAuthor {
			if author.Id != "" {
				out <- author
			}

			author.Id = collaboration.FirstAuthor
			author.Friends = make(map[string]uint16)
		}
		if _, ok := author.Friends[collaboration.SecondAuthor]; !ok {
			author.Friends[collaboration.SecondAuthor] = 0
		}
		author.Friends[collaboration.SecondAuthor]++
	}
	out <- author

	close(out)
}
