import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { KTIcon } from '../../../../_metronic/helpers';
import { ErrorMessage, Field, Form, Formik, FormikValues } from 'formik';
import { ICreateAccount, inits } from './CreateAccountWizardHelper';
import { useNavigate } from 'react-router-dom';
import ClearIcon from '@mui/icons-material/Delete';
import MerchantApplyVisa from '../../../components/MerchantApplyVisa';
import TravelerForm from './TravelerForm';
import Cookies from 'js-cookie';
import { toast } from 'react-toastify'


import axiosInstance from "../../../helpers/axiosInstance";
import { CheckCircleOutline, CircleOutlined } from '@mui/icons-material';
import { colorDarken } from '../../../../_metronic/assets/ts/_utils';
import Loader from '../../../components/Loader';

interface VerticalProps {
  selectedEntry: any; // Define the type for selectedEntry

  show: (value: boolean) => void;
  visaList: boolean;
  visaListLoader: (value: boolean) => void;
  showfinalSubmitLoader: (value: boolean) => void;
}


const inputStyle = {
  border: '1.5px solid #d3d3d3',    // Border width and color
  borderRadius: '15px',         // Border radius
  padding: '10px',
  paddingLeft: '20px',             // Padding
  width: '90%',               // 100% width
  boxSizing: 'border-box',     // Include padding and border in the width calculation
}
const Vertical: React.FC<VerticalProps> = ({ selectedEntry, showfinalSubmitLoader, visaList, visaListLoader, show }) => {
  const handleTravelerDataChange = (data, travelerIndex) => {
    setTravelerForms((prevForms) => {
      const updatedData = [...prevForms];
      updatedData[travelerIndex] = data;
      console.log(updatedData)
      return updatedData;
    });
  };
  const [applicantForms, setApplicantForms] = useState<any[]>([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [loading,setLoading] = useState(false);
  // const [travelerForms, setTravelerForms] = useState([<TravelerForm key={0} onDataChange={handleTravelerDataChange} />]);
  const navigate = useNavigate();

  const [travelerForms, setTravelerForms] = useState<any[]>([
    // Initialize with an empty traveler data object
    {},
  ]);
  const [isFixed, setIsFixed] = useState(false);

  const handleScroll = () => {
    // Calculate the scroll position.
    const scrollY = window.scrollY || window.pageYOffset;

    // Adjust the isFixed state based on the scroll position.
    setIsFixed(scrollY >= 180); // Change 20 to your desired threshold.
  };

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);

    // Clean up the event listener when the component unmounts.
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  const additionalFees = (selectedEntry.receipt['Visa Fees'] || 0) + (selectedEntry.receipt['Service Fees'] || 0);
  const totalAmount = travelerForms.length * additionalFees;



  const addTravelerForm = () => {
    setTravelerForms((prevForms) => [...prevForms, {}]);
  };

  function formatDateWithTimezoneToYMD(dateString) {
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const year = date.getUTCFullYear();
      const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Month is zero-based
      const day = String(date.getUTCDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    return null; // Invalid date string
  }
  const formatDate1 = (dateString) => {
    // Create a Date object from the input date string
    const date = new Date(dateString);

    // Get the month name as a three-letter abbreviation (e.g., "Oct")
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getMonth()];

    // Get the day and year
    const day = date.getDate();
    const year = date.getFullYear();

    // Format the date string
    return `${month} ${day}, ${year}`;
  };

  const handleReviewAndSave = async () => {
    setLoading(true);
    try {
      for (const travelerForm of travelerForms) {

        const postData = {
          country_code: selectedEntry.country_code,
          entry_process: selectedEntry.value,
          nationality_code: selectedEntry.nationality_code,
          first_name: travelerForm.firstName,
          last_name: travelerForm.lastName,
          birth_place: travelerForm.birthPlace,
          birthday_date: formatDateWithTimezoneToYMD(travelerForm.birthDetail),
          nationality: selectedEntry.nationality_code,
          passport_number: travelerForm.passportNumber,
          passport_issue_date: formatDateWithTimezoneToYMD(travelerForm.passportIssueDate),
          passport_expiry_date: formatDateWithTimezoneToYMD(travelerForm.passPortExpiryDate),
          gender: travelerForm.gender,
          marital_status: travelerForm.maritalStatus,
          application_arrival_date: formatDateWithTimezoneToYMD(selectedEntry.application_arrival_date),
          application_departure_date: formatDateWithTimezoneToYMD(selectedEntry.application_departure_date),
          application_destination: selectedEntry.country_code,
          fathers_name: travelerForm.firstName,
          passport_front: travelerForm.passFrontPhoto,
          passport_back: travelerForm.passBackPhoto,
          pan_card: travelerForm.panPhoto,
          photo: travelerForm.travelerPhoto,
          visa_amount: (selectedEntry.receipt['Visa Fees'] ? selectedEntry.receipt['Visa Fees'] : 0) + (selectedEntry.receipt['Service Fees'] ? selectedEntry.receipt['Service Fees'] : 0),
          visa_description: selectedEntry.description
        }

        axiosInstance.post('/backend/create_user_application', postData)
          .then((response) => {
            const user_id = Cookies.get('user_id');

            const data = {
              merchant_id: user_id,
              application_id: response.data.data
            }
            axiosInstance.patch('/backend/add_applicant', data)
              .then((response) => {
                axiosInstance.post('/backend/merchant/apply_visa',data)
                  .then((response) => {
                    console.log(response.data.data)
                    setLoading(false);
                    navigate('/merchant/dashboard');
                  })
                  .catch((error) => {
                    console.error('Error fetching Atlys data:', error);
                    setLoading(false);
                    toast.error(error, {
                      position: 'top-center'
                  });
                  });
              })
              .catch((error) => {
                console.error('Error fetching Atlys data:', error);
                setLoading(false);
              });
          })
          .catch((error) => {
            console.error('Error fetching Atlys data:', error);
            setLoading(false);
            toast.error(error, {
              position: 'top-center'
          });
          });
      }
    } catch (error) {
      console.error('Error while making API calls:', error);
    }
  };



  // Define inline styles for the inactive tab text
  const tabTextStyle = {
    color: '#000', // Text color for the inactive tab
    cursor: 'pointer',
    padding: '8px',
    fontSize: 18,
    fontWeight: 'bold'
  };

  return (
    <div style={{ backgroundColor: '#fff' }} className='w-full'>
      <MerchantApplyVisa visaListLoader={visaListLoader} visaList={visaList} show={show} onApiDataReceived={function (data: any): void {
        throw new Error('Function not implemented.');
      }} />

      <div className='d-flex' style={{ justifyContent: 'space-between', width: '100%', }}>
        <div
          style={{
            width: '20%',
            padding: '16px',
            paddingLeft:"10px",
            position: isFixed ? 'fixed' : 'static',
            height: '100%',
            overflowY: 'auto',
            paddingTop: 20,
            top: isFixed ? 80 : 'auto'
          }}
        >
          {travelerForms.map((_, index) => (
          <>
          <div
            onClick={() => { }}
            style={{ ...tabTextStyle }}
          >
            <CheckCircleOutline style={{ color: '#007bff', marginRight: 10 }} />
            Traveler {index+1}
          </div>
          <div style={{marginLeft:20}}>

          <div
            onClick={() => { }}
            style={{ ...tabTextStyle }}
          >
            <CheckCircleOutline style={{ color: '#007bff', marginRight: 10 }} />
            Passport
          </div>
          <div
            onClick={() => { }}
            style={{ ...tabTextStyle }}
          >
            <CheckCircleOutline style={{ color: '#007bff', marginRight: 10 }} />
            Passport Back
          </div>
          <div
            onClick={() => { }}
            style={{ ...tabTextStyle }}
          >
            <CheckCircleOutline style={{ color: '#007bff', marginRight: 10 }} />
            Traveler Photo
          </div>
          <div
            onClick={() => { }}
            style={{ ...tabTextStyle }}
          >
            <CheckCircleOutline style={{ color: '#007bff', marginRight: 10 }} />
            Indian PAN Card
          </div>
          </div>
          </>
          ))}
          <div
            onClick={() => { }}
            style={{ ...tabTextStyle }}
          >
            <CheckCircleOutline style={{ color: '#007bff', marginRight: 10 }} />
            Review
          </div>
          <div
            onClick={() => { }}
            style={{ ...tabTextStyle, color: '#696969' }}
          >

            <CircleOutlined style={{ color: '#d3d3d3', marginRight: 10 }} />
            Submit
          </div>
        </div>
        <div style={{ width: '80%', marginLeft: isFixed ? '20%' : "0%", }}>
          {travelerForms.map((_, index) => (
            <TravelerForm
              key={index}
              ind={index}
              onDataChange={(newData) => handleTravelerDataChange(newData, index)}
            />
          ))}
          <div className='d-flex mt-10' style={{ justifyContent: 'flex-end', display: 'flex' }}>

            <div className="mb-10 mx-5" style={{ height: 40, paddingLeft: 15, paddingRight: 15, border: "1px solid", borderColor: '#696969', borderRadius: 10, alignItems: 'center', display: 'flex', justifyContent: 'center', backgroundColor: '#fff',cursor:'pointer' }}>
              <h6 className="fs-4" style={{ color: '#007bff' }} onClick={addTravelerForm}>
                + Add Another Traveler
              </h6>
            </div>
          </div>
          
      <div className='d-flex'>
        <div className='py-10 px-20' style={{
          borderRadius: 15, borderColor: '#696969',
          boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.2)',
          marginLeft: 10,
          backgroundColor: 'white',
          width: '60%'
        }}>
          <div>
            <h2 style={{ fontSize: 35 }}>
              Visa Information
            </h2>
            <p style={{ fontSize: 17, paddingTop: 10, lineHeight: 2, paddingBottom: 10 }}>
              {selectedEntry.country_code} - {selectedEntry.description}
              <br />
              Travelers: {travelerForms.length}
              <br />
              Travel Dates: {formatDate1(selectedEntry.application_arrival_date)} - {formatDate1(selectedEntry.application_departure_date)}
            </p>
          </div>
          <hr />

          <div>
            <h2 style={{ fontSize: 35, marginTop: 20 }}>
              Expected Visa Approval
            </h2>
            <h6 style={{ paddingTop: 5, paddingBlock: 10 }}>
              10/12/23, if submitted now!
            </h6>
          </div>
          <hr />
          <div>
            <h2 style={{ fontSize: 35, marginTop: 20 }}>
              Know Before You Pay</h2>
            <br />

            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
              <li style={{ padding: 10 }} >
                <h3>
                  ✓
                  Auto-validation upon submission
                </h3>
                <p style={{ fontSize: 15, marginLeft: 15 }}>
                  Atlys performs automated validation after submission. We will let you know if there are any problems with the application.
                </p>
              </li>
              <li style={{ padding: 10 }} >

                <h3>
                  ✓ Visa processed within 30 seconds
                </h3>

                <p style={{ fontSize: 15, marginLeft: 15 }}>
                  Atlys automatically processes your visa.
                </p>
              </li>
              <li style={{ padding: 10 }} >

                <h3>
                  ✓
                  Non-refundable after you pay
                </h3>

                <p style={{ fontSize: 15, marginLeft: 15 }}>
                  If canceled after payment, you will not be refunded.
                </p>
              </li>
            </ul>
          </div>
        </div>
        <div className='py-10 px-10' style={{
          borderRadius: 10, borderColor: '#f5f5f5',
          boxShadow: '0px 0px 5px rgba(0, 0, 0, 0.2)',
          marginLeft: '10%',
          backgroundColor: 'white',
          height: 350,
          width: "25%"

        }}>
          <h2 style={{ fontSize: 30 }}>Price Details</h2>
          <br />
          <div style={{ padding: 10, backgroundColor: 'rgba(0, 123, 255, 0.15)', borderRadius: 10, paddingTop: 20 }}>
            {travelerForms.map((traveler, index) => (
              <div key={index} className='d-flex' style={{ justifyContent: 'space-between', width: '100%' }}>
                <h5>Traveler {index + 1}:</h5>
                <h5>{(selectedEntry.receipt['Visa Fees'] ? selectedEntry.receipt['Visa Fees'] : 0) + (selectedEntry.receipt['Service Fees'] ? selectedEntry.receipt['Service Fees'] : 0)}/-</h5>
              </div>
            ))}

            <div className='d-flex' style={{ justifyContent: 'space-between', width: '100%' }}>
              <h5>Total: </h5>
              <h5>{totalAmount}/-</h5>
            </div>
            <hr />
            <div className='d-flex' style={{ justifyContent: 'space-between', width: '100%' }}>
              <p>Current Wallet Balance</p>
              <p>200/-</p>
            </div>
          </div>
          <div onClick={handleReviewAndSave} className="mb-10 mt-10" style={{ height: 40, width: 190, border: "1px solid",marginLeft:10, borderColor: '#696969', borderRadius: 20, alignItems: 'center', display: 'flex', justifyContent: 'center', backgroundColor: '#007bff',cursor:'pointer' }}>
            <h6 className="fs-4" style={{ color: 'white' }}>
              Review and Save
            </h6>
          </div>
        </div>
      </div>
    </div>
    </div>
    {loading && (
        <div className="loader-overlay">
          <Loader loading ={loading} />
        </div>
      )}
    </div>
    
  );
};

export { Vertical };
