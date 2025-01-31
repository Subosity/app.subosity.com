import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Spinner } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faChartPie,
  faHandHoldingDollar,
  faCreditCard,
  faCalendarAlt,
  faRotate,
  faHand,
  faMoneyBillWave,
  faCheckSquare
} from '@fortawesome/free-solid-svg-icons';
import { Pie, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale } from 'chart.js';
import { supabase } from '../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getOccurrencesCountInRange } from '../utils/recurrenceUtils';


// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const Dashboard: React.FC = () => {
  const { user } = useAuth(); // Remove requireAuth since we use ProtectedRoute
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSubscriptions: 0,
    activeSubscriptions: 0,
    totalMonthly: 0,
    totalYearly: 0,
    totalDaily: 0,
    autoRenewalCount: 0,
    categoryData: { labels: [], values: [] },
    paymentData: { labels: [], values: [] },
    stateDistribution: {}
  });

  useEffect(() => {
    fetchDashboardData();
  }, []); // Simplified dependency array

  // Add this helper function at the top of the component
  const getComputedColor = (cssVar: string) => {
    return getComputedStyle(document.documentElement)
      .getPropertyValue(cssVar)
      .trim();
  };

  // Move centerTextPlugin inside component to access stats
  const centerTextPluginActive = {
    id: 'centerText',
    afterDraw: (chart) => {
      const { ctx, width, height } = chart;
      ctx.restore();

      // Calculate font size based on chart height
      const fontSize = (height / 114).toFixed(2);
      ctx.font = `${fontSize}em sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--bs-body-color')
        .trim();

      const text = `${stats.activeSubscriptions}/${stats.totalSubscriptions}`;
      const textX = width / 2;
      const textY = height / 2 - (height * 0.05); // Adjust up by 5% of height

      ctx.fillText(text, textX, textY);
      ctx.save();
    }
  };

  const centerTextPluginAutorenews = {
    id: 'centerText',
    afterDraw: (chart) => {
      const { ctx, width, height } = chart;
      ctx.restore();
      const fontSize = (height / 114).toFixed(2);
      ctx.font = `${fontSize}em sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';
      ctx.fillStyle = getComputedStyle(document.documentElement)
        .getPropertyValue('--bs-body-color')
        .trim();

      const text = `${stats.autoRenewalCount}/${stats.totalSubscriptions}`;
      const textX = width / 2;
      const textY = height / 2 - (height * 0.05); // Adjust up by 5% of height

      ctx.fillText(text, textX, textY);
      ctx.save();
    }
  };

  // Add center text plugin for states chart
  const centerTextPluginStates = {
    id: 'centerTextStates',
    afterDraw: (chart) => {
        const { ctx, width, height } = chart;
        ctx.restore();

        // Calculate sum of only visible segments
        const meta = chart.getDatasetMeta(0);
        const total = meta.data.reduce((sum, dataPoint, index) => {
            return dataPoint.hidden ? sum : sum + chart.data.datasets[0].data[index];
        }, 0);

        const fontSize = (height / 114).toFixed(2);
        ctx.font = `${fontSize}em sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'center';
        ctx.fillStyle = getComputedStyle(document.documentElement)
            .getPropertyValue('--bs-body-color')
            .trim();

        const textY = height / 2 - (height * 0.05);
        ctx.fillText(total.toString(), width / 2, textY);
        ctx.save();
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('No user found');
        setLoading(false);
        return;
      }

      // Get ALL subscriptions with their latest state from history
      const { data: subscriptions, error } = await supabase
        .from('subscription')
        .select(`
          *,
          subscription_provider:subscription_provider_id(category, name),
          payment_provider:payment_provider_id(name),
          subscription_history!inner(
            state,
            start_date,
            end_date
          )
        `)
        .eq('owner', user.id)
        .is('subscription_history.end_date', null);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!subscriptions) {
        setLoading(false);
        return;
      }

      // Filter active subscriptions for cost calculations
      const activeSubscriptions = subscriptions.filter(sub => 
        ['active', 'trial'].includes(sub.subscription_history[0]?.state)
      );

      const categories = {};
      const paymentProviders = {};
      
      const now = new Date();
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      
      let yearlyTotal = 0;
      activeSubscriptions.forEach(sub => {
        const amount = sub.amount || 0;
        const yearOccurrences = getOccurrencesCountInRange(sub.recurrence_rule, now, endOfYear);
        const yearCost = yearOccurrences * amount;
        yearlyTotal += yearCost;
        
        const category = sub.subscription_provider?.category || 'Unknown';
        categories[category] = (categories[category] || 0) + 1;
        
        const provider = sub.payment_provider?.name || 'Unknown';
        paymentProviders[provider] = (paymentProviders[provider] || 0) + 1;
      });

      setStats({
        totalSubscriptions: subscriptions.length,
        activeSubscriptions: activeSubscriptions.length,
        totalMonthly: yearlyTotal / 12,
        totalYearly: yearlyTotal,
        totalDaily: yearlyTotal / 365,
        autoRenewalCount: activeSubscriptions.filter(s => s.autorenew).length,
        categoryData: {
          labels: Object.keys(categories),
          values: Object.values(categories)
        },
        paymentData: {
          labels: Object.keys(paymentProviders),
          values: Object.values(paymentProviders)
        },
        stateDistribution: calculateStats(subscriptions).stateDistribution
      });

      setLoading(false);
    } catch (error) {
      console.error('Error in fetchDashboardData:', error);
      setLoading(false);
    }
  };

  // Create theme-aware chart options
  const getChartOptions = (showLegend = true) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            display: showLegend,
            position: 'bottom' as const,
            labels: {
                color: getComputedStyle(document.documentElement)
                    .getPropertyValue('--bs-body-color')
                    .trim(),
                padding: 10,
                usePointStyle: true,
                pointStyle: 'circle'
            }
        }
    }
  });

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        display: true,
        labels: {
          color: getComputedStyle(document.documentElement).getPropertyValue('--bs-body-color').trim()
        }
      }
    }
  };

  // Add state colors mapping
  const stateColors = {
    trial: getComputedColor('--bs-info'),
    active: getComputedColor('--bs-success'),
    canceled: getComputedColor('--bs-danger'),
    expired: getComputedColor('--bs-secondary'),
    paused: getComputedColor('--bs-warning')
  };

  // Update stats calculation
  const calculateStats = (subscriptions: Subscription[]) => {
    const stateGroups = subscriptions.reduce((acc, sub) => {
      acc[sub.state] = (acc[sub.state] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...stats,
      stateDistribution: stateGroups
    };
  };

  return (
    <div className="container py-4">
      <h3 className="mb-4 text-body">
        <FontAwesomeIcon icon={faChartPie} className="me-2" />
        Dashboard Overview
      </h3>

      {loading ? (
        <div className="text-center mt-5">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          <Row className="g-4 mb-4">
            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-body-secondary">Active Subscriptions</div>
                    <div className="bg-success bg-opacity-50 p-2 rounded-3 shadow-sm"
                      style={{
                        width: '40px', height: '40px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                      <FontAwesomeIcon icon={faRotate} className="text-white text-opacity-50" />
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                  <h3 className="mb-0 text-body">{stats.activeSubscriptions} / {stats.totalSubscriptions}</h3>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-body-secondary">Monthly Cost</div>
                    <div className="bg-info bg-opacity-50 p-2 rounded-3 shadow-sm"
                      style={{
                        width: '40px', height: '40px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                      <FontAwesomeIcon icon={faMoneyBillWave} className="text-white text-opacity-50" />
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                  <h3 className="mb-0 text-body">${stats.totalMonthly.toFixed(2)}</h3>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-body-secondary">Yearly Cost</div>
                    <div className="bg-warning bg-opacity-50 p-2 rounded-3 shadow-sm"
                      style={{
                        width: '40px', height: '40px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                      <FontAwesomeIcon icon={faCalendarAlt} className="text-white text-opacity-50" />
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                  <h3 className="mb-0 text-body">${stats.totalYearly.toFixed(2)}</h3>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-body-secondary">Daily Cost</div>
                    <div className="bg-danger bg-opacity-50 p-2 rounded-3 shadow-sm"
                      style={{
                        width: '40px', height: '40px', display: 'flex',
                        alignItems: 'center', justifyContent: 'center'
                      }}>
                      <FontAwesomeIcon icon={faHandHoldingDollar} className="text-white text-opacity-50" />
                    </div>
                  </div>
                </Card.Header>
                <Card.Body className="d-flex justify-content-center align-items-center">
                  <h3 className="mb-0 text-body">${stats.totalDaily.toFixed(2)}</h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Charts */}
          <Row className="g-4">
            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary py-3">
                  <h5 className="mb-0 text-body">
                    <FontAwesomeIcon icon={faChartPie} className="me-2" />
                    Categories
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Pie
                      data={{
                        labels: stats.categoryData.labels,
                        datasets: [{
                          data: stats.categoryData.values,
                          backgroundColor: [
                            '#4a5568',  // muted gray
                            '#2c5282',  // muted blue
                            '#276749',  // muted green
                            '#9b2c2c',  // muted red
                            '#c05621',  // muted orange
                            '#2b6cb0'   // muted steel blue
                          ]
                        }]
                      }}
                      options={pieOptions}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>

            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary py-3">
                  <h5 className="mb-0">
                    <FontAwesomeIcon icon={faCreditCard} className="me-2" />
                    Payment Methods
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Pie
                      data={{
                        labels: stats.paymentData.labels,
                        datasets: [{
                          data: stats.paymentData.values,
                          backgroundColor: [
                            '#718096',  // lighter muted gray
                            '#3182ce',  // lighter muted blue
                            '#38a169',  // lighter muted green
                            '#e53e3e',  // lighter muted red
                            '#dd6b20',  // lighter muted orange
                            '#4299e1'   // lighter muted steel blue
                          ]
                        }]
                      }}
                      options={pieOptions}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6} lg={3}>
            <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary py-3">
                  <h5 className="mb-0 text-body">
                    <FontAwesomeIcon icon={faRotate} className="me-2" />
                    Subscription States
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Doughnut
                      data={{
                        labels: Object.keys(stateColors).map(s => s.charAt(0).toUpperCase() + s.slice(1)),
                        datasets: [{
                          data: Object.keys(stateColors).map(state => stats.stateDistribution[state] || 0),
                          backgroundColor: Object.values(stateColors),
                          borderColor: Object.values(stateColors),
                          borderWidth: 1,
                          cutout: '70%'
                        }]
                      }}
                      options={getChartOptions()}  // Use same options as other charts
                      plugins={[centerTextPluginStates]}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col xs={12} md={6} lg={3}>
              <Card className="h-100 shadow">
                <Card.Header className="bg-body-tertiary py-3">
                  <h5 className="mb-0 text-body">
                    <FontAwesomeIcon icon={faRotate} className="me-2" />
                    Auto-Renews
                  </h5>
                </Card.Header>
                <Card.Body>
                  <div style={{ height: '300px' }}>
                    <Doughnut
                      data={{
                        labels: ['Auto-Renew', 'Manual Renewal'],
                        datasets: [{
                          data: [
                            stats.autoRenewalCount,
                            stats.totalSubscriptions - stats.autoRenewalCount
                          ],
                          backgroundColor: [
                            '#3182ce',  // brighter muted blue
                            getComputedColor('--bs-gray-500')
                          ],
                          borderColor: [
                            '#3182ce',
                            getComputedColor('--bs-gray-500')
                          ],
                          borderWidth: 1,
                          cutout: '70%'
                        }]
                      }}
                      options={getChartOptions()}
                      plugins={[centerTextPluginAutorenews]}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;