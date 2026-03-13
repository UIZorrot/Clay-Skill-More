from __future__ import annotations

import json
from typing import Any, Mapping
from urllib import request
from urllib.error import HTTPError


class ClaySandboxClient:
    def __init__(self, uid: str, sandbox_url: str, sandbox_token: str) -> None:
        self.uid = uid
        self.sandbox_url = sandbox_url.rstrip("/")
        self.sandbox_token = sandbox_token

    def sign(self, payload: Mapping[str, Any]) -> dict[str, Any]:
        full_payload = {"uid": self.uid, **payload}
        return self._request("/api/v1/tx/sign", method="POST", body=full_payload)

    def get_status(self) -> dict[str, Any]:
        return self._request("/api/v1/wallet/status", method="GET")

    def init_wallet(self, master_pin: str | None = None) -> dict[str, Any]:
        body = {}
        if master_pin:
            body["master_pin"] = master_pin
        return self._request("/api/v1/wallet/init", method="POST", body=body)

    def _request(self, path: str, method: str, body: Mapping[str, Any] | None = None) -> dict[str, Any]:
        data = None if body is None else json.dumps(body).encode("utf-8")
        req = request.Request(
            f"{self.sandbox_url}{path}",
            method=method,
            data=data,
            headers={
                "Authorization": f"Bearer {self.sandbox_token}",
                "Content-Type": "application/json",
            },
        )

        try:
            with request.urlopen(req) as resp:
                return json.loads(resp.read().decode("utf-8"))
        except HTTPError as exc:
            detail = exc.read().decode("utf-8", errors="replace")
            raise RuntimeError(f"Clay Sandbox Error ({exc.code}): {detail}") from exc
