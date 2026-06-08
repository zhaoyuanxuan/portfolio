#!/usr/bin/env bash
# ============================================================
#  Portfolio · 新电脑一键部署脚本
#  作者: zhaoyuanxuan
#  仓库: https://github.com/zhaoyuanxuan/portfolio
#
#  用法（在新电脑上）：
#    1. 把本文件拷贝到任意目录（U 盘 / iCloud / 直接 scp / AirDrop 都行）
#    2. 打开终端 Terminal.app，执行：
#         bash ~/Downloads/setup-new-mac.sh
#       或先赋予可执行权限：
#         chmod +x setup-new-mac.sh && ./setup-new-mac.sh
#    3. 按提示输入 GitHub 账号信息（用于 git config）
#    4. 脚本结束后会自动启动本地预览 http://localhost:8765
#
#  脚本干了什么：
#    [1] 检测 / 安装 Homebrew（macOS 包管理器）
#    [2] 检测 / 安装 git、python3
#    [3] 配置 git 全局用户名 / 邮箱
#    [4] 生成 SSH key 并把公钥拷贝到剪贴板（让你贴到 GitHub）
#    [5] 克隆 portfolio 仓库到 ~/Downloads/作品网站
#    [6] 启动本地预览服务器
#    [7] 打印日常修改 + 推送上线的标准流程
# ============================================================

set -e
trap 'echo "❌ 脚本中断（exit $?）。请截图错误信息求助。"' ERR

# ---------- 颜色 ----------
B="\033[1m"; G="\033[32m"; Y="\033[33m"; R="\033[31m"; C="\033[36m"; N="\033[0m"
say()    { printf "${C}▸ %s${N}\n" "$*"; }
ok()     { printf "${G}✓ %s${N}\n" "$*"; }
warn()   { printf "${Y}⚠ %s${N}\n" "$*"; }
err()    { printf "${R}✗ %s${N}\n" "$*"; }
title()  { printf "\n${B}════════════ %s ════════════${N}\n" "$*"; }

# ---------- 配置（可按需修改）----------
REPO_SSH="git@github.com:zhaoyuanxuan/portfolio.git"
REPO_HTTPS="https://github.com/zhaoyuanxuan/portfolio.git"
TARGET_DIR="$HOME/Downloads/作品网站"
DEFAULT_NAME="zhaoyuanxuan"
DEFAULT_EMAIL="zhao851874139@gmail.com"
PREVIEW_PORT=8765

# ---------- 0. 必要前置 ----------
title "0 · 环境检测"
if [[ "$(uname)" != "Darwin" ]]; then
  err "本脚本仅适用于 macOS。当前系统: $(uname)"
  exit 1
fi
ok "macOS 已识别 ($(sw_vers -productName) $(sw_vers -productVersion))"

# ---------- 1. Homebrew ----------
title "1 · Homebrew"
if command -v brew >/dev/null 2>&1; then
  ok "Homebrew 已存在: $(brew --version | head -1)"
else
  say "未检测到 Homebrew，开始安装（约 2 分钟，可能需要输入登录密码）..."
  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
  # M 系列 Mac 需要把 brew 加入 PATH
  if [[ -d /opt/homebrew/bin ]]; then
    eval "$(/opt/homebrew/bin/brew shellenv)"
    if ! grep -q 'brew shellenv' "$HOME/.zprofile" 2>/dev/null; then
      echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> "$HOME/.zprofile"
    fi
  fi
  ok "Homebrew 安装完成"
fi

# ---------- 2. git / python3 ----------
title "2 · Git & Python3"
for pkg in git python3; do
  if command -v "$pkg" >/dev/null 2>&1; then
    ok "$pkg 已存在: $($pkg --version | head -1)"
  else
    say "安装 $pkg ..."
    brew install "$pkg"
    ok "$pkg 安装完成"
  fi
done

# ---------- 3. Git 全局配置 ----------
title "3 · Git 全局用户配置"
CUR_NAME=$(git config --global user.name || true)
CUR_EMAIL=$(git config --global user.email || true)

if [[ -z "$CUR_NAME" ]]; then
  read -r -p "GitHub 用户名 [默认 $DEFAULT_NAME]: " IN_NAME
  IN_NAME=${IN_NAME:-$DEFAULT_NAME}
  git config --global user.name "$IN_NAME"
  ok "user.name = $IN_NAME"
else
  ok "user.name 已配置为: $CUR_NAME"
fi

if [[ -z "$CUR_EMAIL" ]]; then
  read -r -p "GitHub 邮箱 [默认 $DEFAULT_EMAIL]: " IN_EMAIL
  IN_EMAIL=${IN_EMAIL:-$DEFAULT_EMAIL}
  git config --global user.email "$IN_EMAIL"
  ok "user.email = $IN_EMAIL"
else
  ok "user.email 已配置为: $CUR_EMAIL"
fi

# 默认分支 main + pull 用 rebase，避免乱七八糟的 merge commit
git config --global init.defaultBranch main
git config --global pull.rebase false
ok "默认分支 main，pull 策略 = merge"

# ---------- 4. SSH key ----------
title "4 · SSH Key (用于免密推送 GitHub)"
SSH_KEY="$HOME/.ssh/id_ed25519"
NEED_ADD_KEY=0

if [[ -f "$SSH_KEY" ]]; then
  ok "SSH key 已存在: $SSH_KEY"
else
  EMAIL_FOR_KEY=$(git config --global user.email)
  say "生成新 SSH key（无密码，直接回车 3 次）..."
  ssh-keygen -t ed25519 -C "$EMAIL_FOR_KEY" -f "$SSH_KEY" -N ""
  NEED_ADD_KEY=1
  ok "SSH key 已生成"
fi

# 启动 ssh-agent 并加载 key
eval "$(ssh-agent -s)" >/dev/null
ssh-add --apple-use-keychain "$SSH_KEY" 2>/dev/null || ssh-add "$SSH_KEY" 2>/dev/null || true

# 测试 GitHub SSH 是否已绑定
SSH_TEST=$(ssh -o StrictHostKeyChecking=no -o BatchMode=yes -T git@github.com 2>&1 || true)
if echo "$SSH_TEST" | grep -q "successfully authenticated"; then
  ok "GitHub SSH 验证通过 ✨"
  USE_SSH=1
else
  warn "GitHub 还没绑定本机 SSH key，下面引导你完成"
  USE_SSH=0
  NEED_ADD_KEY=1
fi

if [[ $NEED_ADD_KEY -eq 1 ]]; then
  cat "$SSH_KEY.pub" | pbcopy
  ok "公钥已拷贝到剪贴板"
  echo
  echo -e "${B}请按以下步骤把 SSH key 加到 GitHub：${N}"
  echo "  1. 浏览器打开：${C}https://github.com/settings/keys${N}"
  echo "  2. 点击右上角 ${B}New SSH key${N}"
  echo "  3. Title 填写：${C}$(scutil --get ComputerName 2>/dev/null || echo 'My Mac')${N}"
  echo "  4. Key 框内 ${B}⌘V${N} 粘贴（已自动拷贝）"
  echo "  5. 点击 ${B}Add SSH key${N} 完成"
  echo
  read -r -p "完成后按 Enter 继续，或输入 s 跳过用 HTTPS 克隆: " GO
  if [[ "$GO" != "s" ]]; then
    SSH_TEST=$(ssh -o StrictHostKeyChecking=no -o BatchMode=yes -T git@github.com 2>&1 || true)
    if echo "$SSH_TEST" | grep -q "successfully authenticated"; then
      ok "GitHub SSH 验证通过 ✨"
      USE_SSH=1
    else
      warn "仍未通过验证，将改用 HTTPS 克隆（推送时会要求输入用户名 + Personal Access Token）"
      USE_SSH=0
    fi
  fi
fi

# ---------- 5. 克隆仓库 ----------
title "5 · 克隆作品集仓库"
if [[ -d "$TARGET_DIR/.git" ]]; then
  ok "仓库已存在: $TARGET_DIR，执行 git pull 更新到最新"
  cd "$TARGET_DIR"
  git pull --ff-only || warn "pull 失败，可能本地有未提交修改，请手动处理"
else
  if [[ -d "$TARGET_DIR" ]]; then
    warn "目录 $TARGET_DIR 已存在但不是 git 仓库，备份为 ${TARGET_DIR}.bak.$(date +%s)"
    mv "$TARGET_DIR" "${TARGET_DIR}.bak.$(date +%s)"
  fi
  mkdir -p "$(dirname "$TARGET_DIR")"
  if [[ $USE_SSH -eq 1 ]]; then
    say "通过 SSH 克隆..."
    git clone "$REPO_SSH" "$TARGET_DIR"
  else
    say "通过 HTTPS 克隆..."
    git clone "$REPO_HTTPS" "$TARGET_DIR"
  fi
  ok "仓库已克隆到: $TARGET_DIR"
fi

# ---------- 6. 写入快捷脚本 ----------
title "6 · 创建本地工具脚本"
cat > "$TARGET_DIR/preview.sh" <<'EOF'
#!/usr/bin/env bash
# 本地预览：http://localhost:8765
cd "$(dirname "$0")"
PORT=${PORT:-8765}
echo "▸ 启动预览服务器  →  http://localhost:$PORT"
echo "▸ Ctrl+C 关闭"
python3 -m http.server "$PORT"
EOF
chmod +x "$TARGET_DIR/preview.sh"
ok "preview.sh 已创建（双击或 ./preview.sh 启动本地预览）"

cat > "$TARGET_DIR/publish.sh" <<'EOF'
#!/usr/bin/env bash
# 一键提交并推送到 GitHub Pages
set -e
cd "$(dirname "$0")"
MSG=${1:-"chore: update portfolio"}
echo "▸ 拉取远端最新..."
git pull --rebase
echo "▸ 提交所有改动: $MSG"
git add -A
if git diff --cached --quiet; then
  echo "✓ 没有需要提交的改动"
else
  git commit -m "$MSG"
fi
echo "▸ 推送到 GitHub..."
git push
echo "✓ 完成。1–2 分钟后线上更新："
echo "  https://zhaoyuanxuan.github.io/portfolio/"
EOF
chmod +x "$TARGET_DIR/publish.sh"
ok "publish.sh 已创建（用法：./publish.sh \"提交说明\"）"

# ---------- 7. 完成总结 ----------
title "✨ 部署完成"
echo -e "${B}仓库目录：${N} $TARGET_DIR"
echo -e "${B}线上地址：${N} https://zhaoyuanxuan.github.io/portfolio/"
echo
echo -e "${B}日常修改流程（任选一种）：${N}"
echo
echo -e "  ${C}方式 A · 极简（推荐）：${N}"
echo "    cd $TARGET_DIR"
echo "    ./preview.sh                    # 本地预览（http://localhost:8765）"
echo "    # ... 用编辑器修改文件 ..."
echo "    ./publish.sh \"feat: 修改XX模块\"  # 一键提交并上线"
echo
echo -e "  ${C}方式 B · 标准 git：${N}"
echo "    cd $TARGET_DIR"
echo "    git pull"
echo "    # ... 修改文件 ..."
echo "    git add -A && git commit -m \"说明\" && git push"
echo
echo -e "${B}核心文件：${N}"
echo "  index.html        首页"
echo "  case.html         详情页（?p=1..6）"
echo "  styles.css        样式"
echo "  i18n-bundle.js    中英文文案（直接改这里最快）"
echo "  assets/           图片 / PDF / 图标"
echo

# ---------- 8. 自动启动预览 ----------
read -r -p "现在启动本地预览？[Y/n] " RUN
if [[ "$RUN" != "n" && "$RUN" != "N" ]]; then
  cd "$TARGET_DIR"
  # 后台开浏览器
  ( sleep 1 && open "http://localhost:$PREVIEW_PORT" ) &
  echo
  ok "启动 http://localhost:$PREVIEW_PORT  （Ctrl+C 关闭）"
  python3 -m http.server "$PREVIEW_PORT"
else
  echo "稍后可执行：cd $TARGET_DIR && ./preview.sh"
fi
