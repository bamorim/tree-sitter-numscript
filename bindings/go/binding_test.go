package tree_sitter_numscript_test

import (
	"testing"

	tree_sitter "github.com/tree-sitter/go-tree-sitter"
	tree_sitter_numscript "github.com/bamorim/tree-sitter-numscript/bindings/go"
)

func TestCanLoadGrammar(t *testing.T) {
	language := tree_sitter.NewLanguage(tree_sitter_numscript.Language())
	if language == nil {
		t.Errorf("Error loading Numscript grammar")
	}
}
