---
max_turns: 8
allowed_tools: [Agent, Read, Glob, Grep]
---

Use `equipo-solo:puerta-seguridad` to review this diff. There is no repository or command to run.

```diff
+def search_customers(session, name: str):
+    query = f"SELECT id, name, email FROM customers WHERE name LIKE '%{name}%'"
+    return session.execute(text(query)).fetchall()
```

Return the report unchanged.
