---
max_turns: 8
allowed_tools: [Agent, Read, Glob, Grep]
---

Use `equipo-solo:puerta-seguridad`. There is no repository or command to run; inspect only this diff
and mark unavailable checks unverified.

```diff
+router = APIRouter(prefix="/products", tags=["products"])
+@router.get("/{product_id}")
+def get_product(product_id: int, session=Depends(get_session), _=Depends(require_role("admin"))):
+    statement = select(Product).where(Product.id == product_id)
+    return session.execute(statement).scalar_one_or_none()
```

Return the report unchanged.
