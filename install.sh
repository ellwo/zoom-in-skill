#!/usr/bin/env bash
# zoom-in skill installer (macOS / Linux) — no Node required.
#
# Clones the repo to ~/.zoom-in-skill and symlinks the skill folder into each
# detected AI coding agent's skills directory. Updates are a single `git pull`.
#
# Usage:
#   ./install.sh                  Install into every detected editor
#   ./install.sh <editor>...      Install into the named editors only
#   ./install.sh --all            Install into every known editor
#   ./install.sh --project [dir]  Install into ./.cursor/skills etc. of <dir>
#   ./install.sh --update         Pull latest and refresh links
#   ./install.sh --uninstall [editors]   Remove links (default: all)
#   ./install.sh --list           Show installed links
#   ./install.sh --help
#
# Curl-pipe:
#   curl -fsSL https://raw.githubusercontent.com/ellwo/zoom-in-skill/main/install.sh | bash
#   curl -fsSL https://raw.githubusercontent.com/ellwo/zoom-in-skill/main/install.sh | bash -s cursor claude
#
# Environment:
#   ZOOMIN_REPO_URL  Override clone URL (default: official GitHub repo)
#   ZOOMIN_DIR       Override clone destination (default: $HOME/.zoom-in-skill)

set -euo pipefail

REPO_URL="${ZOOMIN_REPO_URL:-https://github.com/ellwo/zoom-in-skill.git}"
REPO_DIR="${ZOOMIN_DIR:-$HOME/.zoom-in-skill}"
SKILL_NAME="zoom-in"

# editor|skills-target-dir
editors_table() {
  cat <<EOF
cursor|$HOME/.cursor/skills
claude|$HOME/.claude/skills
agents|$HOME/.agents/skills
copilot|$HOME/.copilot/skills
cline|$HOME/.cline/skills
gemini|$HOME/.gemini/skills
EOF
}

project_table() {
  cat <<EOF
cursor|.cursor/skills
claude|.claude/skills
agents|.agents/skills
copilot|.copilot/skills
EOF
}

editor_ids() { editors_table | cut -d'|' -f1; }

resolve_editor() {
  local id="$1"
  local row
  row="$(editors_table | awk -F'|' -v id="$id" '$1==id {print; exit}')"
  [[ -z "$row" ]] && { printf 'Unknown editor: %s\nSupported: %s\n' "$id" "$(editor_ids | tr '\n' ' ')" >&2; exit 1; }
  printf '%s\n' "$row"
}

skills_root() { printf '%s/skills/%s\n' "$REPO_DIR" "$SKILL_NAME"; }

clone_or_update() {
  if [[ -d "$REPO_DIR/.git" ]]; then
    printf -- '→ Updating checkout at %s\n' "$REPO_DIR" >&2
    git -C "$REPO_DIR" pull --ff-only
  else
    printf -- '→ Cloning %s → %s\n' "$REPO_URL" "$REPO_DIR" >&2
    mkdir -p "$(dirname "$REPO_DIR")"
    git clone "$REPO_URL" "$REPO_DIR"
  fi
}

# Detect editors whose config home OR skills dir already exists.
detected_editors() {
  local id dir home
  while IFS='|' read -r id dir; do
    home="$(dirname "$(dirname "$dir")")"
    if [[ -d "$home" || -d "$dir" ]]; then printf '%s\n' "$id"; fi
  done < <(editors_table)
}

link_one() {
  local id="$1" target_dir="$2"
  local src
  src="$(skills_root)"
  [[ -d "$src" ]] || { printf 'Skill source not found: %s\n' "$src" >&2; exit 1; }
  mkdir -p "$target_dir"
  if [[ -e "$target_dir/$SKILL_NAME" || -L "$target_dir/$SKILL_NAME" ]]; then
    if [[ -L "$target_dir/$SKILL_NAME" ]]; then
      ln -sfn "$src" "$target_dir/$SKILL_NAME"
    else
      printf '  • %s already exists (not a symlink), skipping. Use --force to replace.\n' "$target_dir/$SKILL_NAME" >&2
      [[ "${FORCE:-0}" == 1 ]] && { rm -rf "$target_dir/$SKILL_NAME"; ln -sfn "$src" "$target_dir/$SKILL_NAME"; }
    fi
  else
    ln -sfn "$src" "$target_dir/$SKILL_NAME"
  fi
  printf '  ✓ %s → %s\n' "$target_dir/$SKILL_NAME" "$src"
}

unlink_one() {
  local id="$1" target_dir="$2"
  [[ -L "$target_dir/$SKILL_NAME" ]] && rm -f "$target_dir/$SKILL_NAME" && printf '  ✓ removed %s/%s\n' "$target_dir" "$SKILL_NAME"
}

cmd_install() {
  local ids=("$@")
  clone_or_update
  if [[ "${ALL:-0}" == 1 ]]; then
    ids=($(editor_ids))
  elif [[ ${#ids[@]} -eq 0 ]]; then
    ids=($(detected_editors))
    [[ ${#ids[@]} -eq 0 ]] && { printf 'No editors detected. Pass editor names explicitly, e.g.:\n  install.sh cursor claude\n' >&2; exit 1; }
  fi
  printf -- '→ Linking skill for: %s\n' "${ids[*]}"
  local id row dir
  for id in "${ids[@]}"; do
    row="$(resolve_editor "$id")"
    dir="$(printf '%s\n' "$row" | cut -d'|' -f2)"
    link_one "$id" "$dir"
  done
  printf '\n✓ Installed zoom-in for: %s\n' "${ids[*]}"
  printf '  Restart your editor/CLI to pick up the skill.\n'
}

cmd_install_project() {
  local root="${1:-$PWD}"
  clone_or_update
  printf -- '→ Linking skill into project: %s\n' "$root"
  local id dir
  while IFS='|' read -r id dir; do
    link_one "$id" "$root/$dir"
  done < <(project_table)
  printf '\n✓ Installed zoom-in (project) into %s\n' "$root"
  printf '  Commit the .cursor/skills (etc.) dirs, or the symlinks, to share with your team.\n'
}

cmd_uninstall() {
  local ids=("$@")
  if [[ ${#ids[@]} -eq 0 ]]; then
    # Remove every symlink that points into our repo.
    local id row dir
    while IFS='|' read -r id dir; do
      [[ -L "$dir/$SKILL_NAME" ]] && unlink_one "$id" "$dir"
    done < <(editors_table)
  else
    local id row dir
    for id in "${ids[@]}"; do
      row="$(resolve_editor "$id")"
      dir="$(printf '%s\n' "$row" | cut -d'|' -f2)"
      unlink_one "$id" "$dir"
    done
  fi
  printf '\n✓ Uninstalled zoom-in links.\n'
  [[ -d "$REPO_DIR" ]] && printf '  Checkout kept at %s. Remove with: rm -rf "%s"\n' "$REPO_DIR" "$REPO_DIR"
}

cmd_update() {
  [[ -d "$REPO_DIR/.git" ]] || { printf 'No installation at %s. Run install first.\n' "$REPO_DIR" >&2; exit 1; }
  clone_or_update
  printf '✓ Updated. Symlinked installs pick up the new version automatically.\n'
}

cmd_list() {
  local found=0 id dir
  while IFS='|' read -r id dir; do
    if [[ -L "$dir/$SKILL_NAME" ]]; then
      printf '  ✓ %s → %s\n' "$id" "$dir/$SKILL_NAME"
      found=1
    fi
  done < <(editors_table)
  [[ $found -eq 0 ]] && printf '  Not installed anywhere.\n'
}

usage() {
  cat <<USAGE
zoom-in skill installer

Usage:
  install.sh                       Install into every detected editor
  install.sh <editor>...           Install into the named editors (e.g. cursor claude)
  install.sh --all                 Install into every known editor
  install.sh --project [dir]       Install into ./.cursor/skills etc. of <dir> (default: PWD)
  install.sh --update              Pull latest and refresh
  install.sh --uninstall [editor]  Remove links (default: all)
  install.sh --list                Show installed links
  install.sh --help

Supported editors:
$(editor_ids | sed 's/^/  - /')

Environment:
  ZOOMIN_REPO_URL  Override clone URL
  ZOOMIN_DIR       Override clone destination (default: \$HOME/.zoom-in-skill)
USAGE
}

main() {
  case "${1:-}" in
    -h|--help) usage ;;
    --update) cmd_update ;;
    --uninstall) shift; cmd_uninstall "$@" ;;
    --list) cmd_list ;;
    --project) shift; cmd_install_project "${1:-}" ;;
    --all) ALL=1; shift; cmd_install "$@" ;;
    "") cmd_install ;;
    -*) printf 'Unknown option: %s\n' "$1" >&2; usage >&2; exit 1 ;;
    *) cmd_install "$@" ;;
  esac
}

main "$@"
