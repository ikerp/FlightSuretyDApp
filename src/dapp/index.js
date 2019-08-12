
import DOM from './dom';
import Contract from './contract';
import './flightsurety.css';


(async() => {

    let result = null;

    let contract = new Contract('localhost', () => {

        // Read transaction
        contract.isOperational((error, result) => {
            display([ { label: 'Operational Status ', error: error, value: result} ]);
        });
    

        // User-submitted transaction
        DOM.elid('submit-oracle').addEventListener('click', () => {
            let flight = DOM.elid('flight-id').value;
            // Write transaction
            contract.fetchFlightStatus(flight, (error, result) => {
                display([ { label: 'Fetch Flight Status ', error: error, value: 'Status code for flight ' + flight + ' is ' + result} ]);
            });
        })

        // User-submitted transaction
        DOM.elid('purchase-insurance').addEventListener('click', () => {
            let flight = DOM.elid('flight-id').value;
            let amount = DOM.elid('amount').value;
            if (amount == '') amount = 0;
             // Write transaction
            contract.buyInsurance(flight, amount, (error, result) => {
                display([ { label: 'Purchase insurance ', error: error, value: 'Confirmed insurance of ' + result + ' ETH for flight ' + flight} ]);
            });
        })
    
    });    

})();


/* function display(title, description, results) {
    let displayDiv = DOM.elid("display-wrapper-b");
    let section = DOM.section();
    section.appendChild(DOM.h2(title));
    section.appendChild(DOM.h5(description));
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div({className: 'col-sm-4 field'}, result.label));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'}, result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
} */

function display(results) {
    let displayDiv = DOM.elid("display-wrapper-b");
    let section = DOM.section();
    results.map((result) => {
        let row = section.appendChild(DOM.div({className:'row'}));
        row.appendChild(DOM.div(result.label));
        row.appendChild(DOM.div("    "));
        row.appendChild(DOM.div({className: 'col-sm-8 field-value'},result.error ? String(result.error) : String(result.value)));
        section.appendChild(row);
    })
    displayDiv.append(section);
}







