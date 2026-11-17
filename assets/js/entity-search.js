/* ============================================================
   企业合规红黑榜 · 主页企业速查（按名称搜索榜单归属）
   挂载点：#entity-search 区块（搜索框 + 结果区）
   数据源：assets/js/search-data.js 的 window.ENTITY_INDEX
   行为：名称模糊匹配 → 按主体聚合 → 列出跨场景/跨榜单归属
   渐进增强：无 JS 时结果区显示引导文案，场景页表格完整可达
   ============================================================ */
(function () {
    "use strict";

    var TIER_ORDER = { red: 0, watch: 1, gray: 2, black: 3 };
    var TIER_CLASS = { red: "badge-red", watch: "badge-watch", gray: "badge-gray", black: "badge-black" };

    function el(tag, className, text) {
        var node = document.createElement(tag);
        if (className) node.className = className;
        if (text != null) node.textContent = text;
        return node;
    }

    /* 单条归属：场景 + 榜单徽标 + 状态 + 摘要 + 证据 + 日期 */
    function buildEntry(entry) {
        var li = el("li", "hit-entry");
        li.appendChild(el("span", "badge " + TIER_CLASS[entry.tier], entry.tierLabel));

        var link = el("a", "hit-scenario", entry.scenarioLabel);
        link.href = entry.url;
        li.appendChild(link);

        var meta = el("div", "hit-meta");
        meta.appendChild(el("span", "hit-status", entry.status));
        meta.appendChild(el("span", "hit-sep", "·"));
        meta.appendChild(el("span", "hit-updated", entry.updated));
        li.appendChild(meta);

        li.appendChild(el("p", "hit-summary", entry.summary));
        li.appendChild(el("p", "hit-evidence", "证据来源：" + entry.evidence));
        return li;
    }

    /* 主体卡：名称 + 虚构徽标 + 榜单归属摘要 + 各条记录 */
    function buildHit(entity) {
        var card = el("article", "hit-card");

        var head = el("div", "hit-head");
        head.appendChild(el("h3", "hit-name", entity.name));
        head.appendChild(el("span", "badge badge-demo", "虚构演示"));
        card.appendChild(head);

        /* 榜单归属总览：红榜 ×1 · 黑名单 ×1 …（颜色+文字双编码） */
        var overview = el("p", "hit-overview");
        overview.appendChild(el("span", "hit-overview-label", "榜单归属："));
        for (var i = 0; i < entity.tiers.length; i++) {
            overview.appendChild(el("span", "badge " + TIER_CLASS[entity.tiers[i].tier],
                entity.tiers[i].tierLabel + " ×" + entity.tiers[i].count));
        }
        card.appendChild(overview);

        var ul = el("ul", "hit-entries");
        for (var j = 0; j < entity.entries.length; j++) {
            ul.appendChild(buildEntry(entity.entries[j]));
        }
        card.appendChild(ul);
        return card;
    }

    /* 聚合：同名主体合并，榜单归属计数按四级顺序排列 */
    function aggregate(rows) {
        var map = {}, order = [];
        for (var i = 0; i < rows.length; i++) {
            var row = rows[i];
            var key = row.name;
            if (!map[key]) {
                map[key] = { name: key, entries: [], tierMap: {} };
                order.push(key);
            }
            map[key].entries.push(row);
            if (!map[key].tierMap[row.tier]) {
                map[key].tierMap[row.tier] = { tier: row.tier, tierLabel: row.tierLabel, count: 0 };
            }
            map[key].tierMap[row.tier].count++;
        }
        var out = [];
        for (var k = 0; k < order.length; k++) {
            var e = map[order[k]];
            var tiers = [];
            for (var t in e.tierMap) {
                if (Object.prototype.hasOwnProperty.call(e.tierMap, t)) tiers.push(e.tierMap[t]);
            }
            /* 榜单归属按严重度优先展示：黑名单 → 灰名单 → 观察名单 → 红榜 */
            tiers.sort(function (a, b) { return TIER_ORDER[b.tier] - TIER_ORDER[a.tier]; });
            e.tiers = tiers;
            out.push(e);
        }
        return out;
    }

    function init() {
        var root = document.getElementById("entity-search");
        if (!root) return;
        var form = root.querySelector(".lookup-form");
        var input = root.querySelector(".lookup-input");
        var results = root.querySelector(".lookup-results");
        var count = root.querySelector(".lookup-count");
        var clear = root.querySelector(".lookup-clear");
        if (!form || !input || !results) return;

        var index = window.ENTITY_INDEX || [];

        function render(rows, query) {
            results.textContent = "";
            if (!query) {
                count.textContent = "输入企业名称查询榜单归属（当前演示索引 " + index.length + " 条记录）";
                results.appendChild(el("p", "lookup-hint",
                    "支持部分名称模糊匹配，例如「演示主体」「DemoLib」。同一主体可能同时出现在不同场景的红榜与黑名单。"));
                clear.disabled = true;
                return;
            }
            clear.disabled = false;
            var hits = aggregate(rows);
            var entryCount = rows.length;
            count.textContent = "「" + query + "」匹配 " + hits.length + " 个主体 · " + entryCount + " 条榜单记录";

            if (hits.length === 0) {
                results.appendChild(el("p", "lookup-empty",
                    "未找到匹配主体 —— 演示索引仅含虚构样例，请尝试「演示主体」或「DemoLib」。"));
                return;
            }
            for (var i = 0; i < hits.length; i++) {
                results.appendChild(buildHit(hits[i]));
            }
        }

        function apply() {
            var q = input.value.trim().toLowerCase();
            if (!q) {
                render([], "");
                return;
            }
            var rows = [];
            for (var i = 0; i < index.length; i++) {
                if (index[i].name.toLowerCase().indexOf(q) !== -1) rows.push(index[i]);
            }
            render(rows, input.value.trim());
        }

        form.addEventListener("submit", function (e) {
            e.preventDefault();
            apply();
        });
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

        render([], "");
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
