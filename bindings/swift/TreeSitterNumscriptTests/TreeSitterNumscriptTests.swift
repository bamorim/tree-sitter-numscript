import XCTest
import SwiftTreeSitter
import TreeSitterNumscript

final class TreeSitterNumscriptTests: XCTestCase {
    func testCanLoadGrammar() throws {
        let parser = Parser()
        let language = Language(language: tree_sitter_numscript())
        XCTAssertNoThrow(try parser.setLanguage(language),
                         "Error loading Numscript grammar")
    }
}
