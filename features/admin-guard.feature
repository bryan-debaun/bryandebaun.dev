Feature: The admin guard rejects everyone who is not an admin
  Every write behind /api/admin runs requireAdmin before it parses a body or
  calls the MCP server. An anonymous caller gets 401; a signed-in user who is
  not an admin gets 403. These scenarios run against a real server and real
  Supabase sessions, never touch the MCP write path, and skip when the
  integration secrets are absent (issue #84, #197).

  Scenario Outline: An anonymous caller is rejected with 401
    When an anonymous caller sends <method> <path>
    Then the response status is 401

    Examples:
      | method | path               |
      | POST   | /api/admin/books   |
      | POST   | /api/admin/authors |
      | PATCH  | /api/admin/books/1 |
      | DELETE | /api/admin/books/1 |

  Scenario Outline: A signed-in non-admin is rejected with 403
    When a signed-in non-admin sends <method> <path>
    Then the response status is 403

    Examples:
      | method | path               |
      | POST   | /api/admin/books   |
      | POST   | /api/admin/authors |
      | PATCH  | /api/admin/books/1 |
      | DELETE | /api/admin/books/1 |
