$(document).ready(function() {

    $("#sendMsg").click(function(e){
        console.log("clicked send msg button");
        e.preventDefault();
        var checkBoxes = $(".friend-select-checkbox:checked");

        var userIds = [];
        checkBoxes.map(function(i, c){
            console.log("i and c", i, c, $(c).attr('data-userid'));
            var userId = $(c).attr('data-userid');
            userIds.push(userId);
        });

        var _csrf = $('#_csrf').val();
        var msg = $('#fbmsg').val();
        console.log("_csrf: ", _csrf);

        if(msg && msg.trim) msg = msg.trim();

        if(!msg || msg.length < 1){
            $('#fbmsg').notify("Where's the message honey?", {className: "error", position: "bottom center", arrowShow: false});
            return false;
        }

        if(userIds.length < 1) {
            $('#fbmsg').notify("Ummm.. shouldn't you select atleast 1 friend?", {className: "error", position: "bottom center", arrowShow: false});
            return false;
        }

        var data = {
            selectedFriendsList: userIds,
            message: msg,
            _csrf: _csrf
        };

        console.log("sending msg to ", userIds, JSON.stringify(data));
        $("#sendMsg").prop('disabled', true);
        $("#loadingBtn").show();

        $.ajax({
                url: "/bot/fb/msgFrnds",
                method: "POST",
                dataType: "json",
                contentType: "application/json;charset=utf-8",
                data: JSON.stringify(data)
            })
            .done(function(done) {
                $("#sendMsg").prop('disabled', false);
                $("#loadingBtn").hide();

                console.log( "fb msg frnds gave us:", done );
                $('.navbar-fixed-top').notify("Awesome! Your messages would soon start delivering. :)",  {className: "success", clickToHide: true, autoHide: false, position: "bottom right", arrowShow: false});
            })
            .error(function(err){
                $("#sendMsg").prop('disabled', false);
                $("#loadingBtn").hide();

                console.error("error fb msg frnds:", err);
                var s = err.message ? " ("+err.message+")" : '';
                $('.navbar-fixed-top').notify("O.o You broke me master"+s+". Try again?", {className: "error", clickToHide: true, autoHide: false, position: "bottom right", arrowShow: false});
            });


        return false;
    })

});

function invertFriendsSelection() {
    var count = 0;
    $('.friend-select-checkbox').map(function(i, chkbox){
        $(chkbox).prop('checked', !$(chkbox).is(":checked") );
        count += !$(chkbox).is(":checked") ? 1 : 0;
    })


}

function selectAllFriends(){
    $('.friend-select-checkbox').map(function(i, chkbox){
        console.log("checked: ", $(chkbox).attr('checked') );
        $(chkbox).prop('checked', true);
    })
}

function unselectAllFriends(){
    $('.friend-select-checkbox').map(function(i, chkbox){
        console.log("checked: ", $(chkbox).attr('checked') );
        $(chkbox).prop('checked', false);
    })
}