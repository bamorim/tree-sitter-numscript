/**
 * @file Numscript grammar for tree-sitter
 * @author Bernardo Amorim
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

module.exports = grammar({
  name: 'numscript',

  extras: $ => [
    /\s/,
    $.line_comment,
    $.multiline_comment,
  ],

  conflicts: $ => [
    [$.dest_inorder, $.remaining_allotment],
  ],

  rules: {
    program: $ => seq(
      optional($.vars_declaration),
      repeat($.statement),
    ),

    // Comments
    line_comment: $ => token(seq('//', /.*/)),
    multiline_comment: $ => token(seq(
      '/*',
      /[^*]*\*+([^/*][^*]*\*+)*/,
      '/'
    )),

    // Variables declaration
    vars_declaration: $ => seq(
      'vars',
      '{',
      repeat($.var_declaration),
      '}'
    ),

    var_declaration: $ => seq(
      field('type', $.identifier),
      field('name', $.variable_name),
      optional($.var_origin)
    ),

    var_origin: $ => seq('=', $.value_expr),

    // Statements
    statement: $ => choice(
      $.send_statement,
      $.save_statement,
      $.fn_call_statement,
    ),

    send_statement: $ => seq(
      'send',
      $.sent_value,
      '(',
      'source',
      '=',
      $.source,
      'destination',
      '=',
      $.destination,
      ')'
    ),

    save_statement: $ => seq(
      'save',
      $.sent_value,
      'from',
      $.value_expr
    ),

    fn_call_statement: $ => $.function_call,

    sent_value: $ => choice(
      alias($.value_expr, $.sent_literal),
      $.sent_all_lit,
    ),

    sent_all_lit: $ => seq(
      '[',
      field('asset', $.value_expr),
      '*',
      ']'
    ),

    // Value expressions
    value_expr: $ => choice(
      $.variable_expr,
      $.asset_literal,
      $.string_literal,
      $.account_literal,
      $.number_literal,
      $.percentage_portion_literal,
      $.monetary_literal,
      $.infix_expr,
      $.parenthesized_expr,
      $.application,
    ),

    variable_expr: $ => $.variable_name,

    asset_literal: $ => $.asset,

    string_literal: $ => $.string,

    account_literal: $ => seq(
      '@',
      $.account_literal_part,
      repeat(seq(':', $.account_literal_part))
    ),

    account_literal_part: $ => choice(
      $.account_text,
      alias($.variable_name, $.account_var),
    ),

    number_literal: $ => $.number,

    percentage_portion_literal: $ => $.percentage_portion,

    monetary_literal: $ => seq(
      '[',
      field('asset', $.value_expr),
      field('amount', $.value_expr),
      ']'
    ),

    infix_expr: $ => choice(
      prec.left(1, seq(
        field('left', $.value_expr),
        field('op', choice('+', '-')),
        field('right', $.value_expr)
      )),
      prec.left(2, seq(
        field('left', $.value_expr),
        field('op', '/'),
        field('right', $.value_expr)
      )),
    ),

    parenthesized_expr: $ => seq(
      '(',
      $.value_expr,
      ')'
    ),

    application: $ => $.function_call,

    // Function calls
    function_call: $ => seq(
      field('name', choice($.identifier, 'overdraft')),
      '(',
      optional($.function_call_args),
      ')'
    ),

    function_call_args: $ => seq(
      $.value_expr,
      repeat(seq(',', $.value_expr))
    ),

    // Source expressions
    source: $ => choice(
      $.src_account_unbounded_overdraft,
      $.src_account_bounded_overdraft,
      $.src_account,
      $.src_allotment,
      $.src_inorder,
      $.src_oneof,
      $.src_capped,
    ),

    src_account_unbounded_overdraft: $ => seq(
      field('address', $.value_expr),
      optional($.color_constraint),
      'allowing',
      'unbounded',
      'overdraft'
    ),

    src_account_bounded_overdraft: $ => seq(
      field('address', $.value_expr),
      optional($.color_constraint),
      'allowing',
      'overdraft',
      'up',
      'to',
      field('max_overdraft', $.value_expr)
    ),

    src_account: $ => seq(
      $.value_expr,
      optional($.color_constraint)
    ),

    src_allotment: $ => seq(
      '{',
      repeat1($.allotment_clause_src),
      '}'
    ),

    src_inorder: $ => seq(
      '{',
      repeat($.source),
      '}'
    ),

    src_oneof: $ => seq(
      'oneof',
      '{',
      repeat1($.source),
      '}'
    ),

    src_capped: $ => seq(
      'max',
      field('cap', $.value_expr),
      'from',
      $.source
    ),

    allotment_clause_src: $ => seq(
      $.allotment,
      'from',
      $.source
    ),

    // Destination expressions
    destination: $ => choice(
      $.dest_account,
      $.dest_allotment,
      $.dest_inorder,
      $.dest_oneof,
    ),

    dest_account: $ => $.value_expr,

    dest_allotment: $ => seq(
      '{',
      repeat1($.allotment_clause_dest),
      '}'
    ),

    dest_inorder: $ => seq(
      '{',
      repeat($.destination_in_order_clause),
      'remaining',
      $.kept_or_destination,
      '}'
    ),

    dest_oneof: $ => seq(
      'oneof',
      '{',
      repeat($.destination_in_order_clause),
      'remaining',
      $.kept_or_destination,
      '}'
    ),

    allotment_clause_dest: $ => seq(
      $.allotment,
      $.kept_or_destination
    ),

    destination_in_order_clause: $ => seq(
      'max',
      $.value_expr,
      $.kept_or_destination
    ),

    kept_or_destination: $ => choice(
      $.destination_to,
      $.destination_kept,
    ),

    destination_to: $ => seq('to', $.destination),

    destination_kept: $ => 'kept',

    // Allotment
    allotment: $ => choice(
      $.portioned_allotment,
      $.remaining_allotment,
    ),

    portioned_allotment: $ => $.value_expr,

    remaining_allotment: $ => 'remaining',

    // Color constraint
    color_constraint: $ => seq('\\', $.value_expr),

    // Terminal tokens
    variable_name: $ => /\$[a-z_]+[a-z0-9_]*/,

    identifier: $ => /[a-z]+[a-z_]*/,

    number: $ => /-?[0-9]+(_[0-9]+)*/,

    asset: $ => /[A-Z][A-Z0-9]*(\/[0-9]+)?/,

    percentage_portion: $ => /[0-9]+(\.[0-9]+)?%/,

    string: $ => /"([^"\r\n]|\\")*"/,

    account_text: $ => /[a-zA-Z0-9_-]+/,
  }
});
