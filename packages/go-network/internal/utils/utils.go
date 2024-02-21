package utils

import (
	"fmt"
)

func Join[Type any](array []Type, separator string) string {
	result := ""
	for i, item := range array {
		if i != 0 {
			result += separator
		}
		result += fmt.Sprint(item)
	}
	return result
}
