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

        var data = {
            selectedFriendsList: userIds,
            message: msg,
            _csrf: _csrf
        };

        console.log("sending msg to ", userIds, JSON.stringify(data));
        $.ajax({
                url: "/bot/fb/msgFrnds",
                method: "POST",
                dataType: "json",
                contentType: "application/json;charset=utf-8",
                data: JSON.stringify(data)
            })
            .done(function(done) {
                console.log( "fb msg frnds gave us:", done );
            })
            .error(function(err){
                console.error("error fb msg frnds:", err);
            });


        return false;
    })

});

function invertFriendsSelection() {
    $('.friend-select-checkbox').map(function(i, chkbox){
        $(chkbox).prop('checked', !$(chkbox).is(":checked") );
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