var reqwest = require('reqwest'),
    qs = require('qs'),
    moment = require('moment');

var osmHistory = (function osmDeepHistory() {
    var baseUrl = 'http://api.openstreetmap.org/api/0.6/';

    var s = {};

    function historyUrl(kind, id) {
        return baseUrl + kind + '/' + id + '/history';
    }

    function requestObjectHistory(obj_type, obj_id, cb) {
        reqwest({
            url: historyUrl(obj_type, obj_id),
            crossOrigin: true,
            type: 'xml',
            success: function(res) {
                cb(null, res);
            }
        });
    }

    function parseElementHistory(x, obj_type) {
        if (!x) return undefined;
        var o = [],
            i,
            nodes = [],
            members = [],
            nds = x.getElementsByTagName(obj_type);
        for (i = 0; i < nds.length; i++) {
            var nodeElem = nds[i],
                n = {
                    type: nodeElem.tagName,
                    user: nodeElem.getAttribute('user'),
                    timestamp: moment(nodeElem.getAttribute('timestamp')),
                    changeset: +nodeElem.getAttribute('changeset'),
                    version: +nodeElem.getAttribute('version'),
                    id: +nodeElem.getAttribute('id')
                },
                tgs = nodeElem.getElementsByTagName('tag'),
                tags = {};
            for (var j = 0; j < tgs.length; j++) {
                tags[tgs[j].getAttribute("k")] = tgs[j].getAttribute("v");
            }
            n.tags = tags;

            if (n.type === 'node') {
                n.lat = +nodeElem.getAttribute('lat');
                n.lon = +nodeElem.getAttribute('lon');
            } else if (n.type === 'way') {
                for (var k = 0; k < nds.length; k++) {
                    nodes.push(+nds[k].getAttribute('ref'));
                }
                n.nodes = nodes;
            } else if (n.type === 'relation') {
                for (var l = 0; l < memberElems.length; l++) {
                    members.push({
                        type: memberElems[l].getAttribute('type'),
                        ref: memberElems[l].getAttribute('ref'),
                        role: memberElems[l].getAttribute('role')
                    });
                }
            }

            o.push(n);
        }
        return o;
    }

    s.getObjectHistory = function(obj_type, obj_id, cb) {
        requestObjectHistory(obj_type, obj_id, function(err, xml) {
            if (err) return cb(err);
            if (!xml.getElementsByTagName) return cb('No items');
            var obj = parseElementHistory(xml, obj_type);
            cb(null, obj);
        });
    };

    return s;
})();

module.exports = osmHistory;