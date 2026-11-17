/* ============================================================
   企业合规红黑榜 · 表格查询过滤
   挂载点：每个 .table-wrap（table.data-table）自动获得独立过滤器
   行为：关键词即时过滤行、匹配计数、空态提示、Esc/清除按钮复位
   渐进增强：无 JS 时表格内容完整可见，仅无过滤框
   ============================================================ */
(function () {
    "use strict";

    var EMPTY_CLASS = "filter-empty-row";

    function findLabel(wrap) {
        var block = wrap.closest(".tier-block");
        if (block) {
            var badge = block.querySelector(".tier-header .badge");
            if (badge) return badge.textContent.trim();
        }
        var prev = wrap.parentElement ? wrap.parentElement.querySelector("h3") : null;
        if (prev) return prev.textContent.trim();
        return "表格";
    }

    function countRows(tbody) {
        var n = 0, rows = tbody.rows;
        for (var i = 0; i < rows.length; i++) {
            if (!rows[i].classList.contains("placeholder-row") &&
                !rows[i].classList.contains(EMPTY_CLASS)) n++;
        }
        return n;
    }

    function getFilterableRows(tbody) {
        var out = [], rows = tbody.rows;
        for (var i = 0; i < rows.length; i++) {
            if (!rows[i].classList.contains("placeholder-row") &&
                !rows[i].classList.contains(EMPTY_CLASS)) out.push(rows[i]);
        }
        return out;
    }

    function ensureEmptyRow(tbody, colspan) {
        var tr = tbody.querySelector("." + EMPTY_CLASS);
        if (!tr) {
            tr = document.createElement("tr");
            tr.className = EMPTY_CLASS;
            var td = document.createElement("td");
            td.colSpan = colspan;
            td.textContent = "无匹配条目 —— 请调整关键词后重试";
            tr.appendChild(td);
            tbody.appendChild(tr);
        }
        return tr;
    }

    function attach(wrap) {
        var table = wrap.querySelector("table.data-table");
        if (!table || wrap.dataset.filtered === "1") return;
        wrap.dataset.filtered = "1";

        var tbody = table.tBodies[0];
        if (!tbody) return;
        var colspan = table.tHead ? table.tHead.rows[0].cells.length : 1;
        var total = countRows(tbody);
        var label = findLabel(wrap);

        /* ---- 过滤条 ---- */
        var bar = document.createElement("div");
        bar.className = "filter-bar";

        var input = document.createElement("input");
        input.type = "search";
        input.className = "filter-input";
        input.placeholder = "输入关键词过滤「" + label + "」条目…";
        input.setAttribute("aria-label", "过滤「" + label + "」榜单条目");
        if (total === 0) {
            input.disabled = true;
            input.placeholder = "本表暂无可过滤数据行";
        }

        var count = document.createElement("span");
        count.className = "filter-count";
        count.setAttribute("aria-live", "polite");
        count.textContent = total > 0 ? "匹配 " + total + " / " + total + " 条" : "共 0 条";

        var clear = document.createElement("button");
        clear.type = "button";
        clear.className = "filter-clear";
        clear.textContent = "清除";
        clear.disabled = true;
        clear.setAttribute("aria-label", "清除「" + label + "」过滤关键词");

        bar.appendChild(input);
        bar.appendChild(count);
        bar.appendChild(clear);
        wrap.parentNode.insertBefore(bar, wrap);

        /* ---- 过滤行为 ---- */
        var emptyRow = null;

        function apply() {
            var q = input.value.trim().toLowerCase();
            var rows = getFilterableRows(tbody);
            var shown = 0;
            for (var i = 0; i < rows.length; i++) {
                var hit = q === "" || rows[i].textContent.toLowerCase().indexOf(q) !== -1;
                rows[i].hidden = !hit;
                if (hit) shown++;
            }
            count.textContent = "匹配 " + shown + " / " + rows.length + " 条";
            clear.disabled = q === "";
            if (shown === 0 && rows.length > 0) {
                emptyRow = ensureEmptyRow(tbody, colspan);
                emptyRow.hidden = false;
            } else if (emptyRow) {
                emptyRow.hidden = true;
            }
        }

        input.addEventListener("input", apply);
        input.addEventListener("keydown", function (e) {
            if (e.key === "Escape" && input.value !== "") {
                input.value = "";
                apply();
            }
        });
        clear.addEventListener("click", function () {
            input.value = "";
            apply();
            input.focus();
        });
    }

    function init() {
        var wraps = document.querySelectorAll(".table-wrap");
        for (var i = 0; i < wraps.length; i++) attach(wraps[i]);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
