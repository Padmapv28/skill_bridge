import pytest

from app.routes import ops

pytestmark = pytest.mark.asyncio


async def test_healthz(client):
    r = await client.get("/healthz")
    assert r.status_code == 200 and r.json() == {"status": "ok"}


async def test_readyz_ok_and_down(client, monkeypatch):
    class Up:
        async def command(self, name):
            return {"ok": 1}

    class Down:
        async def command(self, name):
            raise RuntimeError("mongo unreachable")

    monkeypatch.setattr(ops, "db", Up())
    assert (await client.get("/readyz")).status_code == 200
    monkeypatch.setattr(ops, "db", Down())
    assert (await client.get("/readyz")).status_code == 503
