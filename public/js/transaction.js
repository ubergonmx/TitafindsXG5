var Transactions = [];

/**
 * Request data from the server and if refreshGrid is true,
 * render it in the grid.
 * @param  {boolean} [refreshGrid=false] - If true, render the data in the grid.
 */
function getAllTransactions(refreshGrid = false) {
    $.ajax({
        url: "/getTransactions",
        type: "GET",
        processData: false,
        contentType: false,
        headers: {
            "Content-Type": "application/json",
        },
        success: function (items) {
            Transactions = [];

            var dfd = $.Deferred().resolve();

            items.forEach(function (trans) {
                dfd = dfd.then(function () {
                    return pushTransaction(trans);
                });
            });

            dfd.done(function () {
                if (refreshGrid) {
                    w2ui["transaction-grid"].records = Transactions.reverse();
                    w2ui["transaction-grid"].refresh();
                }

                $("#table-filter-apply").attr("disabled", false);
            });
        },
    });
}
/**
 * This function pushes the transaction of the item in the transaction array
 * @param {Object} trans - transaction object
 */
function pushTransaction(trans) {
    var dfd = $.Deferred();

    $.ajax({
        url: `/getItemById=${trans.description}`,
        type: "GET",
        processData: false,
        contentType: false,
        headers: {
            "Content-Type": "application/json",
        },
        success: function (item) {
            trans.date = formatDate(new Date(trans.date));
            Transactions.push(
                new transaction(
                    trans.date,
                    trans.type,
                    `Item ${trans.type} - ${item.name} (${item.code})`,
                    trans.quantity,
                    trans.sellingPrice,
                    trans.transactedBy
                )
            );
            dfd.resolve();
        },
    });

    return dfd.promise();
}

function transaction(date, type, desc, quantity, sellingPrice, transactedBy) {
    return {
        recid: Transactions.length + 1,
        date: date,
        type: type,
        description: desc,
        quantity: quantity,
        sellingPrice: sellingPrice,
        transactedBy: transactedBy,
    };
}

function filter() {
    var searchBar = $("#filter-search").val();
    var typeBar = $("#dropdown-selected").html();

    $("#table-filter-apply").attr("disabled", true);

    // Cheats the empty search bar
    if (!searchBar) {
        searchBar = "empty";
    }

    if (searchBar == "empty" && typeBar == "Type") {
        getAllTransactions(true);
    } else {
        $.ajax({
            url: `/searchTransactions=${typeBar}&${searchBar}`,
            type: "GET",
            processData: false,
            contentType: false,
            headers: { "Content-Type": "application/json" },
            success: function (items) {
                Transactions = [];

                var dfd = $.Deferred().resolve();

                items.forEach(function (trans) {
                    dfd = dfd.then(function () {
                        return pushTransaction(trans);
                    });
                });

                dfd.done(function () {
                    w2ui["transaction-grid"].records = Transactions.reverse();
                    w2ui["transaction-grid"].refresh();

                    $("#table-filter-apply").attr("disabled", false);
                });
            },
        });
    }
}

// On document ready
$(function () {
    $("#transaction-grid").w2grid({
        name: "transaction-grid",
        show: {
            footer: true,
            lineNumbers: true,
        },
        method: "GET",
        limit: 50,
        recordHeight: 60,
        columns: [
            { field: "date", text: "Date", size: "23%", sortable: true },
            { field: "type", text: "Type", size: "7%", sortable: true },
            { field: "description", text: "Description", size: "50%", sortable: true },
            { field: "quantity", text: "Quantity", size: "5%", sortable: true },
            { field: "sellingPrice", text: "Selling Price", size: "6%", sortable: true },
            { field: "transactedBy", text: "Transacted By", size: "7%", sortable: true },
        ],
        records: Transactions,
        onDblClick: function (recid) {
            // Redirects to item page

            var record = w2ui["transaction-grid"].get(recid.recid);

            var strArray = record.description.split(" ");
            var str = strArray[strArray.length - 1];
            var code = str.substring(str.indexOf("(") + 1, str.lastIndexOf(")"));

            window.open(`/item/${code}`, "_blank");
        },
    });

    getAllTransactions(true);

    $("#table-filter-refresh, #table-filter-apply").click(function () {
        filter();
    });

    $(".dropdown-type").click(function () {
        var text = $(this).html();
        if (text != "Any") $("#dropdown-selected").html(text);
        else $("#dropdown-selected").html("Type");
    });

    // Clears table filters
    $("#table-filter-clear").click(function () {
        $("#filter-search").val("");
        $("#dropdown-selected").html("Type");
    });

    $(window).resize(function () {
        console.log("refresh/resize");
        w2ui["transaction-grid"].refresh();
    });
});