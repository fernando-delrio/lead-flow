---
max_turns: 8
allowed_tools: [Agent, Read, Glob, Grep]
---

Use `equipo-solo:puerta-seguridad` to review this FastAPI diff. There is no repository or command to
run; inspect only the text and mark unavailable checks unverified.

```diff
+router = APIRouter(prefix="/users", tags=["users"])
+@router.delete("/{user_id}", status_code=204)
+def delete_user(user_id: int, session=Depends(get_session)):
+    service.delete_user(session, user_id)
```

Return the report unchanged.
