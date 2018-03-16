var expect    = require("chai").expect;
var matchmaker = require("../app/matchmaker");

describe("Matchmaker", function() {
    describe("List all tasks", function() {
        it("lists all tasks", function() {
            var res = {};
            res.json = function(json) { return json; };

            var drek = matchmaker.list_all_tasks(null, res);

            expect(drek).to.equal({ message: 'Task successfully deleted' });
        });
    });

});