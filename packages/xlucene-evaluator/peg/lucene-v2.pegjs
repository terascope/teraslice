/** Functions **/
{
    /**
    * Propagate the default field on a field group expression
    */
    function propagateDefaultField(node, field) {
       if (!node) return;

       const termTypes = ['term', 'regexp', 'range', 'wildcard'];
       if (termTypes.includes(node.type) && !node.field) {
           node.field = field;
           return;
       }

       if (node.type === 'negation') {
           propagateDefaultField(node.node, field);
           return;
       }

       const groupTypes = ['logical-group', 'field-group'];
       if (groupTypes.includes(node.type)) {
           for (const conj of node.flow) {
               propagateDefaultField(conj, field);
           }
           return;
       }

       if (node.type === 'conjunction') {
           for (const conj of node.nodes) {
               propagateDefaultField(conj, field);
           }
           return;
       }
    }

    function parseGeoDistance(str) {
        const trimed = str.trim().toLowerCase();
        const matches = trimed.match(/(\d+)(.*)$/);
        if (!matches || !matches.length) {
            throw new Error(`Incorrect geo distance parameter provided: ${str}`);
        }

        const distance = parseFloat(matches[1]);
        const unit = GEO_DISTANCE_UNITS[matches[2]];
        if (!unit) {
            throw new Error(`Incorrect distance unit provided: ${matches[2]}`);
        }

        return { distance, unit };
    }

    function parseGeoPoint(str) {
        const points = str.split(',');

        return {
            lat: parseFloat(points[0]),
            lon: parseFloat(points[1]),
        }
    }

    const MileUnits = {
        mi: 'miles',
        miles: 'miles',
        mile: 'miles',
    };

    const NMileUnits = {
        NM:'nauticalmiles',
        nmi: 'nauticalmiles',
        nauticalmile: 'nauticalmiles',
        nauticalmiles: 'nauticalmiles'
    };

    const inchUnits = {
        in: 'inches',
        inch: 'inches',
        inches: 'inches'
    };

    const yardUnits = {
        yd: 'yards',
        yard: 'yards',
        yards: 'yards'
    };

    const meterUnits = {
        m: 'meters',
        meter: 'meters',
        meters: 'meters'
    };

    const kilometerUnits = {
        km: 'kilometers',
        kilometer: 'kilometers',
        kilometers: 'kilometers'
    };

    const millimeterUnits = {
        mm: 'millimeters',
        millimeter: 'millimeters',
        millimeters: 'millimeters'
    };

    const centimetersUnits = {
        cm: 'centimeters',
        centimeter: 'centimeters',
        centimeters: 'centimeters'
    };

    const feetUnits = {
        ft: 'feet',
        feet: 'feet'
    };

    const GEO_DISTANCE_UNITS = Object.assign({}, MileUnits, NMileUnits, inchUnits, yardUnits, meterUnits, kilometerUnits, millimeterUnits, centimetersUnits, feetUnits);
}


/** Control Flow **/
start
    = ws* negate:NegationExpression ws* EOF { return negate }
    / ws* logic:LogicalGroup ws* { return logic; }
    / ws* term:UnqoutedTermType ws* EOF { return term; }
    / ws* term:TermExpression ws* EOF { return term; }
    / ws* EOF { return {} }

/** Expressions */
LogicalGroup
   = flow:Conjunction+ {
        return {
            type: 'logical-group',
            flow
        };
   }

Conjunction
    = nodes:AndConjunctionLeft+ {
        return {
            type: 'conjunction',
            operator: 'AND',
            nodes: [].concat(...nodes),
        }
    }
    / nodes:AndConjunctionRight+ {
        return {
            type: 'conjunction',
            operator: 'AND',
            nodes: [].concat(...nodes),
        }
    }
    / nodes:OrConjunctionLeft+ {
        return {
            type: 'conjunction',
            operator: 'OR',
            nodes: [].concat(...nodes),
        }
    }
    / nodes:OrConjunctionRight+ {
        return {
            type: 'conjunction',
            operator: 'OR',
            nodes: [].concat(...nodes),
        }
    }

ParensGroup
    = '(' ws* group:LogicalGroup ws* ')' {
        return group;
    }

TermGroup
    = NegationExpression / ParensGroup / TermExpression

FieldOrQuotedTermGroup
    = ParensGroup / FieldOrQuotedTermExpression

NegationExpression
    = 'NOT' ws+ node:NegatedTermGroup {
        return {
            type: 'negation',
            node
        }
    }
    / '!' ws* node:NegatedTermGroup {
        return {
            type: 'negation',
            node
        }
    }

NegatedTermGroup
    = node:ParensGroup / node:TermExpression

FieldGroup
    = field:FieldName ws* FieldSeparator ws* group:ParensGroup {
        propagateDefaultField(group, field);
        return {
            ...group,
            type: 'field-group',
            field,
        }
    }

AndConjunctionLeft
    = left:TermGroup ws+ nodes:AndConjunctionRight {
        return [left, ...nodes]
    }

AndConjunctionRight
    = ws* &'NOT' ws* right:TermGroup nodes:AndConjunctionRight? {
        if (!nodes) return [right];
        return [right, ...nodes];
    }
    / ws* AndConjunctionOperator ws+ right:TermGroup nodes:AndConjunctionRight? {
        if (!nodes) return [right];
        return [right, ...nodes];
    }

OrConjunctionLeft
    = left:TermGroup ws+ nodes:OrConjunctionRight {
        return [left, ...nodes]
    }
    / left:FieldOrQuotedTermGroup ws+ right:TermGroup {
        return [left, right]
    }
    / left:TermGroup ws+ right:FieldOrQuotedTermGroup {
        return [left, right]
    }

OrConjunctionRight
    = ws* OrConjunctionOperator ws+ right:TermGroup nodes:OrConjunctionRight? {
        if (!nodes) return [ right ];
        return [right, ...nodes];
    }

BaseTermExpression
    = ExistsKeyword ws* FieldSeparator ws* field:FieldName {
        return {
            type: 'exists',
            field,
        }
    }
    / field:FieldName ws* FieldSeparator ws* range:RangeExpression {
        return {
            ...range,
            field,
        }
    }
    / FieldGroup
    / field:FieldName ws* FieldSeparator ws* term:TermType {
        return {
            ...term,
            field,
        }
    }

TermExpression
    = GeoTermExpression
    / BaseTermExpression
    / range:RangeExpression {
        return {
            ...range,
            field: null,
        }
    }
    / term:TermType {
        return {
            ...term,
            field: null,
        }
    }

FieldOrQuotedTermExpression
    = BaseTermExpression
    / term:QuotedStringType {
        return {
            ...term,
            field: null,
        }
    }

GeoTermExpression
    = field:FieldName ws* FieldSeparator ws* '(' ws* term:GeoTermType ws* ')' {
        return {
            ...term,
            field,
        };
    }

ParensStringType
    = '(' ws* term:UnqoutedStringType ws* ')' {
        return term;
    }

UnqoutedTermType
    = term:UnqoutedStringType {
        return {
            ...term,
            field: null,
        }
    }

RangeExpression
    = left:LeftRangeExpression ws+ RangeJoinOperator ws+ right:RightRangeExpression {
        return {
            type: 'range',
            left,
            right,
        }
    }
    / operator:RangeOperator value:TermType {
        return {
            type: 'range',
            left: {
                operator,
                ...value,
            },
        }
    }

LeftRangeExpression
    = operator:StartRangeChar ws* value:LeftRangeType {
        return {
            ...value,
            operator,
        }
    }

RightRangeExpression
    = ws* value:RightRangeType operator:EndRangeChar {
        return {
            ...value,
            operator,
        }
    }

GeoTermType
    = point:GeoPointValue ws* distance:GeoDistanceValue {
        return {
            type: 'geo-distance',
            ...point,
            ...distance
        }
    }
    / distance:GeoDistanceValue ws* point:GeoPointValue {
        return {
            type: 'geo-distance',
            ...point,
            ...distance
        }
    }
    / topLeft:GeoTopLeftValue ws* bottomRight:GeoBottomRightValue {
        return {
            type: 'geo-bounding-box',
            ...topLeft,
            ...bottomRight
        }
    }
    / bottomRight:GeoBottomRightValue ws* topLeft:GeoTopLeftValue  {
        return {
            type: 'geo-bounding-box',
            ...topLeft,
            ...bottomRight
        }
    }

LeftRangeType
    = NegativeInfinityType / RangeTermType

RightRangeType
    = PostiveInfinityType / RangeTermType

RangeTermType
    = FloatType
    / IntegerType
    / QuotedStringType
    / RestrictedStringType

TermType
    = FloatType
    / IntegerType
    / RegexpType
    / BooleanType
    / WildcardType
    / ParensStringType
    / QuotedStringType
    / RestrictedStringType

NegativeInfinityType
    = '*' {
        return {
            type: 'term',
            data_type: 'number',
            value: Number.NEGATIVE_INFINITY
        }
    }

PostiveInfinityType
    = '*' {
        return {
            type: 'term',
            data_type: 'number',
            value: Number.POSITIVE_INFINITY
        }
    }

FloatType
    = value:FloatValue {
        return {
            type: 'term',
            data_type: 'float',
            value
        }
    }

IntegerType
    = value:IntegerValue {
        return {
            type: 'term',
            data_type: 'integer',
            value
        }
    }

BooleanType
  = value:Boolean {
      return {
        type: 'term',
        data_type: 'boolean',
        value
      }
  }

RegexpType
    = value:RegexValue {
        return {
            type: 'regexp',
            data_type: 'string',
            value
        }
    }

WildcardType
  = value:WildcardValue {
       return {
           type: 'wildcard',
           data_type: 'string',
           value
       };
    }

QuotedStringType
    = value:QuotedTermValue {
        return {
            type: 'term',
            data_type: 'string',
            quoted: true,
            value
        };
    }

UnqoutedStringType
    = value:UnquotedTermValue {
       return {
           type: 'term',
           data_type: 'string',
           quoted: false,
           value
       };
    }

RestrictedStringType
    = value:RestrictedStringValue {
       return {
           type: 'term',
           data_type: 'string',
           restricted: true,
           quoted: false,
           value
       };
    }

FieldName
    = chars:FieldChar+ { return chars.join('') }

GeoPointValue
    = GeoPointKeyword ws* FieldSeparator ws* term:QuotedStringType {
        return parseGeoPoint(term.value);
    }

GeoDistanceValue
    = GeoDistanceKeyword ws* FieldSeparator ws* term:RestrictedStringType {
        return parseGeoDistance(term.value);
    }

GeoTopLeftValue
    = GeoTopLeftKeyword ws* FieldSeparator ws* term:QuotedStringType {
         return {
             top_left: parseGeoPoint(term.value)
         }
    }

GeoBottomRightValue
    = GeoBottomRightKeyword ws* FieldSeparator ws* term:QuotedStringType {
         return {
             bottom_right: parseGeoPoint(term.value)
         }
    }


UnquotedTermValue
    = chars:TermChar+ {
        return chars.join('');
    }

RestrictedStringValue
    = chars:RestrictedTermChar+ {
        return chars.join('');
    }

WildcardValue
    = chars:WildcardCharSet+ {
        return chars.join('');
    }

RegexValue
  = '/' chars:RegexStringChar* '/' { return chars.join(''); }

IntegerValue
   = int:$('0' / OneToNine Digit*) &NumReservedChar { return parseInt(int, 10); }

FloatValue
  = float:$(Digit* '.' Digit+) &NumReservedChar { return parseFloat(float) }

/** keywords **/
GeoPointKeyword
    = '_geo_point_'

GeoDistanceKeyword
    = '_geo_distance_'

GeoTopLeftKeyword
    = '_geo_box_top_left_'

GeoBottomRightKeyword
    = '_geo_box_bottom_right_'

ExistsKeyword
    = '_exists_'

Boolean
  = 'true' { return true }
  / 'false' { return false }

RangeOperator
    = '>=' { return 'gte' }
    / '>' { return 'gt' }
    / '<=' { return 'lte' }
    / '<' { return 'lt' }

StartRangeChar
    = '[' { return 'gte' }
    / '{' { return 'gt' }

EndRangeChar
    = ']' { return 'lte' }
    / '}' { return 'lt' }

RangeJoinOperator
    = 'TO'

/** Characters **/
WildcardCharSet
  = $([^\?\*]* ('?' / '*')+ [^\?\*]*)

FieldChar
  = [_a-zA-Z0-9-\.\?\*]

FieldSeparator
  = ':'

TermChar
  = "\\" sequence:ReservedChar { return '\\' + sequence; }
  / '.' / [^:\{\}()"/^~\[\]]

RestrictedTermChar
  =  "\\" sequence:ReservedChar { return '\\' + sequence; }
  / '.' / [^: \t\r\n\f\{\}()"/^~\[\]]

QuotedTermValue
  = '"' chars:DoubleStringChar* '"' { return chars.join(''); }

DoubleStringChar
  = !('"' / "\\") char:. { return char; }
  / "\\" sequence:ReservedChar { return '\\' + sequence; }

RegexStringChar
  = !('/' / "\\") char:. { return char; }
  / "\\" sequence:ReservedChar { return '\\' + sequence; }

AndConjunctionOperator
    = 'AND' / '&&'

OrConjunctionOperator
    = 'OR' / '||'

NotOperator
    = 'NOT' / '!'

ZeroChar
    = '0'

OneToNine
    = [1-9]

Digit
    = [0-9]

NumReservedChar
  = " "
  / "]"
  / "}"
  / ")"
  / EOF

ReservedChar
  = "+"
  / "-"
  / "!"
  / "("
  / ")"
  / "{"
  / "}"
  / "["
  / "]"
  / "^"
  / "\""
  / "?"
  / ":"
  / "\\"
  / "&"
  / "|"
  / "'"
  / "/"
  / "~"
  / "*"
  / " "
  / AndConjunctionOperator
  / OrConjunctionOperator
  / NotOperator

EOF
  = !.

// whitespace
ws "whitespace"
  = "\t"
  / "\v"
  / "\f"
  / " "
