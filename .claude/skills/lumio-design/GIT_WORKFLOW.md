# GIT_WORKFLOW.md — Quy ước Git/GitHub cho Lumio

> Quy trình branch / commit / PR cho cả con người + AI agent.
> Mọi rule dưới đây là **bắt buộc** trừ khi PR là `exp/*`.

---

## 1. Branch model

```
main                      ← protected, deploy thẳng production qua Vercel
│
├─ feat/uc7-speaking      ← feature mới (1 use case)
├─ feat/uc10-vocab-srs
├─ fix/vocab-save-race    ← bug fix
├─ chore/upgrade-next     ← dependency / refactor không đổi behavior
├─ docs/api-design        ← chỉ sửa markdown
├─ db/add-essay-versions  ← migration thuần
└─ exp/new-onboarding     ← experiment, không bao giờ merge main
```

**Quy ước scope:**
- Use case → `feat/uc<N>-<slug>` (UC1 = `feat/uc1-signup`, UC10 = `feat/uc10-vocab-srs`)
- Bug → `fix/<scope>-<symptom>` (`fix/vocab-save-race`)
- Migration → `db/<slug>`
- Dependency → `chore/upgrade-<package>`

**Một branch = một concern.** Không trộn `feat` với `chore` trong cùng branch.

---

## 2. Commit — Conventional Commits

### 2.1 Format

```
<type>(<scope>): <subject tiếng Việt — < 72 ký tự>

<body — what + why, không phải how>

<footer — Refs: UCx | BREAKING CHANGE: ...>
```

### 2.2 Type được phép

| Type | Khi nào |
|---|---|
| `feat` | Tính năng mới (user thấy được) |
| `fix` | Bug fix (user thấy được) |
| `refactor` | Đổi cấu trúc, **không** đổi behavior |
| `perf` | Tối ưu hiệu năng |
| `docs` | Chỉ sửa markdown / comment |
| `test` | Thêm / sửa test |
| `chore` | Build, deps, config |
| `style` | Format, indent, semicolon (không đổi logic) |
| `db` | Migration / schema change |
| `ci` | GitHub Actions, workflow |

### 2.3 Scope

Theo module: `vocab`, `speak`, `read`, `write`, `auth`, `onboarding`, `notify`, `db`, `ai`, `deps`.

### 2.4 Subject tiếng Việt

- Mở đầu bằng động từ (thêm, sửa, tách, gộp, đổi, bỏ).
- < 72 ký tự. Không có dấu chấm cuối.
- Không hoa toàn bộ. Không Title Case.

Tốt:
```
feat(vocab): thêm SRS scheduler theo SM-2
fix(speak): popup correction không đóng khi Escape
refactor(read): tách reader page thành 3 component
db: thêm bảng essay_versions với RLS
```

Xấu:
```
feat: Update                              ← quá mơ hồ
Fix bug                                   ← thiếu scope, không conventional
feat: Thêm SRS Scheduler                  ← Title Case
feat: thêm srs scheduler theo sm-2.       ← có chấm cuối
feat(vocab): thêm SRS scheduler theo SuperMemo-2 algorithm với điều chỉnh ease factor  ← > 72 char
```

### 2.5 Body — what + why

Body trả lời:
- **What** đã thay đổi (1 đoạn ngắn)
- **Why** thay đổi (lý do nghiệp vụ / kỹ thuật)
- **Không** mô tả how (đọc code thấy được)

Ví dụ:
```
feat(vocab): thêm SRS scheduler theo SM-2

Triển khai SuperMemo-2 trong lib/srs/sm2.ts. Function pure nhận
state cũ + quality (0–5), trả về state mới (repetition, intervalDays,
easeFactor).

Lý do dùng SM-2 thay vì FSRS: thuật toán đơn giản, đã chứng minh đủ
hiệu quả cho dataset < 10K word/user (xem DESIGN_PATTERNS.md §6).

Refs: UC10
```

### 2.6 Footer

```
Refs: UC10
Closes: #42
BREAKING CHANGE: vocabRepo.save() đổi signature
Co-authored-by: <name> <email>
```

### 2.7 Quy mô commit

- **1 commit = 1 ý nghĩa.** Đừng gộp "thêm feature + fix lỗi indent" vào cùng commit.
- Trước commit: `git diff --staged` đọc lại, không bao giờ `git add .`.

### 2.8 Khi nào amend / rebase

- `git commit --amend` chỉ cho commit cuối của **chính bạn**, **chưa push** hoặc chỉ trên branch riêng.
- `git rebase -i main` cho phép sắp xếp lại trên branch riêng trước khi mở PR.
- **Tuyệt đối không** force-push lên `main`.

---

## 3. Pull Request

### 3.1 Mở PR

```bash
gh pr create --fill --base main
```

`--fill` lấy commit message làm title + body. Nếu nhiều commit, sửa lại theo template.

### 3.2 Template PR

Có sẵn ở `.github/pull_request_template.md`. Phải điền đủ:

- **Mục đích:** 1 câu nói tại sao PR tồn tại
- **Thay đổi:** bullet list từng thay đổi đáng chú ý
- **Cách test:** bước cụ thể để verify
- **Use case:** UCx tham chiếu
- **Screenshot:** nếu thay đổi UI (cả light + dark mode)

### 3.3 Size limits

- < 400 dòng diff (không tính generated file, lock file)
- > 400 dòng → tách thành nhiều PR liên tiếp với commit message rõ phụ thuộc
- Migration PR luôn đứng riêng (không gộp với app code dùng schema mới)

### 3.4 CI phải xanh

Trước khi request review:
- typecheck ✓
- lint ✓
- test (unit + integration) ✓
- build ✓
- (tuỳ) E2E ✓

Nếu CI đỏ → sửa, không xin review.

### 3.5 Review

- Reviewer focus: nghiệp vụ + bảo mật + RLS + Zod validation
- Comment dùng tiếng Việt
- Approve / Request changes — không "LGTM 🚀" qua loa

### 3.6 Merge

- Strategy: **Squash merge** (1 commit = 1 PR trên main).
- Squash commit message = PR title format Conventional.
- Sau merge: branch tự xoá (GitHub setting).

---

## 4. Hooks

### 4.1 Pre-commit (qua husky + lint-staged)

```json
// package.json
"lint-staged": {
  "*.{ts,tsx}": ["eslint --fix", "tsc --noEmit"],
  "*.{md,json,yml}": ["prettier --write"]
}
```

### 4.2 Pre-push

```bash
pnpm test
```

Nếu test fail → push bị chặn.

### 4.3 Disable hooks tạm thời

```bash
git commit --no-verify       # CHỈ khi hot fix, ghi rõ trong PR
```

---

## 5. Tagging / Release

- Tag semver: `v0.1.0`, `v0.2.0`, …
- Tag chỉ trên `main`, sau khi PR merge.
- Generate changelog từ Conventional Commits qua `git-cliff` hoặc `release-please`.

---

## 6. Khi conflict với main

```bash
git fetch origin
git rebase origin/main
# resolve conflict
git rebase --continue
git push --force-with-lease    # force-with-lease an toàn hơn force
```

Không bao giờ `git push --force`. Luôn `--force-with-lease`.

---

## 7. Quy ước cho AI agent (Claude Code)

Xem `CLAUDE.md §2` để biết chi tiết:

- Mặc định **không tự commit** — đề xuất message, đợi user xác nhận
- Không bao giờ `git add .`
- Không bao giờ push lên `main` trực tiếp
- Không bao giờ `git push --force`
- Khi user nói "commit" → AI agent generate Conventional Commits message + propose, **chưa run** `git commit` cho đến khi user ok

---

## 8. Quick reference

```bash
# Branch mới từ main
git switch main && git pull
git switch -c feat/uc10-vocab-srs

# Hoàn thành unit work
git status
git diff
git add src/lib/srs/sm2.ts src/lib/srs/sm2.test.ts
git commit -m "feat(vocab): thêm SRS scheduler theo SM-2"

# Push + open PR
git push -u origin feat/uc10-vocab-srs
gh pr create --fill

# CI ready, request review
gh pr ready
gh pr edit --add-reviewer <username>

# Sau khi approve
gh pr merge --squash --delete-branch
```

---

## 9. Trouble-shooting

| Vấn đề | Giải pháp |
|---|---|
| Lỡ commit lên main | `git reset --soft HEAD~1`, tạo branch, commit lại |
| Lỡ commit secret | Revoke ngay + `git filter-repo` + force-push (sau khi confirm với team) |
| Branch quá lệch main | `git rebase origin/main` (KHÔNG `merge main`) |
| PR conflict không resolve được | Tạo branch mới từ main, cherry-pick commit cần giữ |
