"""Static validation for exported n8n workflow JSON files."""

from __future__ import annotations

import json
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
WORKFLOWS_DIR = ROOT / "workflows"


def validate_javascript(code: str, workflow_path: Path, node_name: str) -> list[str]:
    """Compile a Code node's JavaScript without executing it."""
    source = f"async function __validateN8nCode() {{\n{code}\n}}\n"
    with tempfile.TemporaryDirectory() as directory:
        script_path = Path(directory) / "workflow-code.js"
        script_path.write_text(source, encoding="utf-8")
        try:
            result = subprocess.run(
                ["node", "--check", str(script_path)],
                capture_output=True,
                text=True,
                check=False,
            )
        except OSError as error:
            return [f"{workflow_path.name}: unable to run Node.js: {error}"]

    if result.returncode == 0:
        return []

    detail = result.stderr.strip() or result.stdout.strip() or "Unknown syntax error"
    return [f"{workflow_path.name}: Code node {node_name!r}: {detail}"]


def validate_workflow(path: Path) -> list[str]:
    errors: list[str] = []
    try:
        workflow: dict[str, Any] = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as error:
        return [f"{path.name}: invalid JSON: {error}"]

    if not isinstance(workflow, dict):
        return [f"{path.name}: workflow root must be a JSON object"]

    if not isinstance(workflow.get("name"), str) or not workflow["name"].strip():
        errors.append(f"{path.name}: missing workflow name")

    if workflow.get("active") is not False:
        errors.append(f"{path.name}: workflow must remain inactive in the portfolio")

    nodes = workflow.get("nodes")
    if not isinstance(nodes, list) or not nodes:
        return errors + [f"{path.name}: nodes must be a non-empty list"]

    node_objects = [node for node in nodes if isinstance(node, dict)]
    names = [node.get("name") for node in node_objects]
    ids = [node.get("id") for node in node_objects]

    if len(node_objects) != len(nodes):
        errors.append(f"{path.name}: every node must be an object")
    valid_names = [name for name in names if isinstance(name, str)]
    valid_ids = [node_id for node_id in ids if isinstance(node_id, str)]
    if len(valid_names) != len(set(valid_names)):
        errors.append(f"{path.name}: duplicate node names")
    if len(valid_ids) != len(set(valid_ids)):
        errors.append(f"{path.name}: duplicate node IDs")
    if any(not isinstance(name, str) or not name.strip() for name in names):
        errors.append(f"{path.name}: every node must have a non-empty name")
    if any(not isinstance(node_id, str) or not node_id.strip() for node_id in ids):
        errors.append(f"{path.name}: every node must have a non-empty ID")

    node_names = set(valid_names)
    for node in nodes:
        if not isinstance(node, dict):
            continue
        node_name = str(node.get("name", "<unnamed>"))
        if node.get("credentials"):
            errors.append(
                f"{path.name}: node {node_name!r} contains credential references"
            )

        if node.get("type") == "n8n-nodes-base.code":
            parameters = node.get("parameters")
            code = parameters.get("jsCode") if isinstance(parameters, dict) else None
            if not isinstance(code, str) or not code.strip():
                errors.append(f"{path.name}: Code node {node_name!r} has no JavaScript")
            else:
                errors.extend(validate_javascript(code, path, node_name))

    connections = workflow.get("connections", {})
    if not isinstance(connections, dict):
        errors.append(f"{path.name}: connections must be an object")
        return errors

    for source_name, outputs_by_type in connections.items():
        if source_name not in node_names:
            errors.append(
                f"{path.name}: connection source {source_name!r} does not exist"
            )
        if not isinstance(outputs_by_type, dict):
            errors.append(
                f"{path.name}: connections for {source_name!r} must be an object"
            )
            continue

        for output_groups in outputs_by_type.values():
            if not isinstance(output_groups, list):
                errors.append(f"{path.name}: connection outputs must be lists")
                continue
            for group in output_groups:
                if not isinstance(group, list):
                    errors.append(f"{path.name}: each connection group must be a list")
                    continue
                for connection in group:
                    if not isinstance(connection, dict):
                        errors.append(
                            f"{path.name}: connection entry must be an object"
                        )
                        continue
                    target_name = connection.get("node")
                    if target_name not in node_names:
                        errors.append(
                            f"{path.name}: connection target {target_name!r} does not exist"
                        )

    return errors


def main() -> int:
    workflow_paths = sorted(WORKFLOWS_DIR.glob("*.json"))
    if not workflow_paths:
        print("No workflow JSON files found.", file=sys.stderr)
        return 1

    errors = [error for path in workflow_paths for error in validate_workflow(path)]
    if errors:
        print("\n".join(f"ERROR: {error}" for error in errors), file=sys.stderr)
        return 1

    print(
        f"Validated {len(workflow_paths)} inactive workflow exports: "
        "JSON structure, node references, credential references, and Code-node syntax."
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
